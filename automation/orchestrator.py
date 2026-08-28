#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import re
import select
import shlex
import signal
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUTOMATION_DIR = PROJECT_ROOT / "automation"
STATE_DIR = AUTOMATION_DIR / "state"
LOG_DIR = AUTOMATION_DIR / "logs"
CONFIG_PATH = AUTOMATION_DIR / "config.json"

STEP_HEADING_RE = re.compile(
    r"^##\s+Etapa\s+(\d+)\s*[—\-–]\s*(.+?)\s*$",
    re.MULTILINE,
)

# Exit code sintetizado quando o orchestrator encerra o agente por tempo.
EXIT_TIMEOUT = 124
EXIT_IDLE_TIMEOUT = 125


def run_command(
    command: list[str],
    *,
    cwd: Path = PROJECT_ROOT,
    capture_output: bool = False,
) -> subprocess.CompletedProcess[str]:
    """Executa um comando e retorna seu resultado."""

    print(f"\n$ {' '.join(command)}\n")

    return subprocess.run(
        command,
        cwd=cwd,
        text=True,
        check=False,
        capture_output=capture_output,
    )


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}

    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def resolve_spec_path(spec: Path) -> Path:
    """Aceita arquivo .md ou pasta contendo spec.md."""

    if not spec.is_absolute():
        spec = PROJECT_ROOT / spec

    if spec.is_dir():
        candidate = spec / "spec.md"
        if candidate.exists():
            return candidate.resolve()

        matches = sorted(spec.glob("*.md"))
        if len(matches) == 1:
            return matches[0].resolve()

        raise FileNotFoundError(
            f"Pasta {spec} não contém spec.md (ou um único .md)."
        )

    if not spec.exists():
        raise FileNotFoundError(f"Spec não encontrada: {spec}")

    return spec.resolve()


def relative_spec_path(spec: Path) -> Path:
    return spec.relative_to(PROJECT_ROOT)


def state_id(spec: Path) -> str:
    """Identificador estável para state/logs (evita colisão de stem 'spec')."""

    return (
        relative_spec_path(spec)
        .as_posix()
        .replace("/", "-")
        .removesuffix(".md")
    )


def parse_steps(spec_text: str) -> dict[int, dict[str, str]]:
    """Extrai etapas no formato '## Etapa N — Título'."""

    matches = list(STEP_HEADING_RE.finditer(spec_text))

    if not matches:
        raise ValueError(
            "Nenhuma etapa encontrada. Use headings no formato: "
            "'## Etapa N — Título'."
        )

    steps: dict[int, dict[str, str]] = {}

    for match in matches:
        step_number = int(match.group(1))
        title = match.group(2).strip()
        start = match.end()
        next_section = re.search(r"^##\s+", spec_text[start:], re.MULTILINE)
        end = start + next_section.start() if next_section else len(spec_text)
        content = spec_text[start:end].strip()

        steps[step_number] = {
            "title": f"Etapa {step_number} — {title}",
            "content": content,
        }

    return steps


def detect_profile(spec: Path, config: dict, cli_profile: str | None) -> str:
    if cli_profile:
        return cli_profile

    relative = relative_spec_path(spec).as_posix()
    validation = config.get("validation", {})
    spec_profiles = validation.get("spec_profiles", {})

    if relative in spec_profiles:
        return spec_profiles[relative]

    path_lower = relative.lower()
    if "manual" in path_lower or "dokuwiki" in path_lower or "docs/manual" in path_lower:
        return "docs"

    return validation.get("default_profile", "jabot")


def detect_agent(config: dict, cli_agent: str | None) -> str:
    if cli_agent:
        return cli_agent

    return config.get("execution", {}).get("agent", "codex")


def load_prompt_template(config: dict, profile: str, *, fix: bool = False) -> str:
    prompts = config.get("prompts", {})

    if fix:
        if profile == "static" and "fix_static" in prompts:
            relative = prompts["fix_static"]
        elif profile == "docs" and "fix_docs" in prompts:
            relative = prompts["fix_docs"]
        elif profile == "jabot" and "fix_jabot" in prompts:
            relative = prompts["fix_jabot"]
        else:
            relative = prompts.get("fix", "automation/prompts/fix-step.txt")
    else:
        relative = prompts.get(
            profile,
            prompts.get("laravel", "automation/prompts/implement-step.txt"),
        )

    path = PROJECT_ROOT / relative

    if not path.exists():
        raise FileNotFoundError(f"Template de prompt não encontrado: {path}")

    return path.read_text(encoding="utf-8")


def render_prompt(
    template: str,
    *,
    spec: Path,
    step_title: str,
    step_content: str,
    error_output: str = "",
) -> str:
    return (
        template.replace("{SPEC_PATH}", relative_spec_path(spec).as_posix())
        .replace("{STEP_TITLE}", step_title)
        .replace("{STEP_CONTENT}", step_content)
        .replace("{ERROR_OUTPUT}", error_output)
        .strip()
    )


def ensure_clean_repository(config: dict) -> None:
    if not config.get("git", {}).get("require_clean_repository", True):
        return

    result = run_command(
        ["git", "status", "--porcelain"],
        capture_output=True,
    )

    if result.returncode != 0:
        raise RuntimeError("Não foi possível verificar o estado do Git.")

    if result.stdout.strip():
        print(
            "O repositório possui alterações não commitadas.\n"
            "Faça commit ou stash antes de iniciar a automação.",
            file=sys.stderr,
        )
        sys.exit(1)


def load_state(spec: Path) -> dict:
    state_file = STATE_DIR / f"{state_id(spec)}.json"

    if not state_file.exists():
        return {
            "spec": relative_spec_path(spec).as_posix(),
            "completed_steps": [],
            "failed_step": None,
        }

    return json.loads(state_file.read_text(encoding="utf-8"))


def save_state(spec: Path, state: dict) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)

    state_file = STATE_DIR / f"{state_id(spec)}.json"
    state_file.write_text(
        json.dumps(state, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def _terminate_process_tree(process: subprocess.Popen[str]) -> None:
    """Encerra o processo do agente e filhos (grupo de sessão)."""

    if process.poll() is not None:
        return

    try:
        os.killpg(process.pid, signal.SIGTERM)
    except (ProcessLookupError, PermissionError, OSError):
        process.terminate()

    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except (ProcessLookupError, PermissionError, OSError):
            process.kill()
        process.wait(timeout=5)


def build_agent_command(agent: str, prompt: str, agent_cfg: dict) -> list[str]:
    """Monta o comando de execução não interativa para o backend escolhido."""

    command_name = agent_cfg.get("command", agent)

    if agent == "codex":
        sandbox = agent_cfg.get("sandbox", "workspace-write")
        return [command_name, "exec", "--sandbox", sandbox, prompt]

    if agent == "claude":
        permission_mode = agent_cfg.get("permission_mode", "bypassPermissions")
        output_format = agent_cfg.get("output_format", "text")
        return [
            command_name,
            "-p",
            prompt,
            "--permission-mode",
            permission_mode,
            "--output-format",
            output_format,
        ]

    raise ValueError(f"Backend de agente desconhecido: {agent!r}")


def run_agent(agent: str, prompt: str, config: dict, log_file: Path) -> tuple[int, str]:
    """Executa o backend de agente configurado com timeout total e idle (sem saída)."""

    agent_cfg = config.get(agent, {})
    timeout_seconds = int(agent_cfg.get("timeout_seconds", 3600))
    idle_timeout_seconds = int(agent_cfg.get("idle_timeout_seconds", 900))

    if timeout_seconds <= 0:
        raise ValueError(f"{agent}.timeout_seconds deve ser > 0.")

    command = build_agent_command(agent, prompt, agent_cfg)

    output_chunks: list[str] = []
    started_at = time.monotonic()
    last_output_at = started_at

    print(
        f"Timeouts {agent}: total={timeout_seconds}s"
        + (
            f", idle={idle_timeout_seconds}s (sem saída)"
            if idle_timeout_seconds > 0
            else ", idle=desligado"
        )
    )

    with log_file.open("w", encoding="utf-8") as log:
        process = subprocess.Popen(
            command,
            cwd=PROJECT_ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            start_new_session=True,
            bufsize=1,
        )

        assert process.stdout is not None
        stdout = process.stdout

        timed_out = False
        idle_timed_out = False

        while True:
            if process.poll() is not None and not select.select([stdout], [], [], 0)[0]:
                # Drena o que restar no pipe após o processo sair.
                remainder = stdout.read()
                if remainder:
                    print(remainder, end="")
                    log.write(remainder)
                    log.flush()
                    output_chunks.append(remainder)
                break

            now = time.monotonic()
            elapsed = now - started_at
            remaining_total = timeout_seconds - elapsed

            if remaining_total <= 0:
                timed_out = True
                break

            if idle_timeout_seconds > 0:
                idle_elapsed = now - last_output_at
                if idle_elapsed >= idle_timeout_seconds:
                    idle_timed_out = True
                    break
                wait_for = min(remaining_total, idle_timeout_seconds - idle_elapsed, 1.0)
            else:
                wait_for = min(remaining_total, 1.0)

            ready, _, _ = select.select([stdout], [], [], max(wait_for, 0.05))

            if not ready:
                continue

            line = stdout.readline()
            if line == "":
                # EOF do stdout.
                if process.poll() is not None:
                    break
                continue

            last_output_at = time.monotonic()
            print(line, end="")
            log.write(line)
            log.flush()
            output_chunks.append(line)

        if timed_out or idle_timed_out:
            reason = (
                f"Timeout total ({timeout_seconds}s) excedido."
                if timed_out
                else f"Timeout idle ({idle_timeout_seconds}s sem saída) excedido."
            )
            print(f"\n{reason} Encerrando {agent} (pid={process.pid})...", file=sys.stderr)
            log.write(f"\n[orchestrator] {reason}\n")
            log.flush()
            _terminate_process_tree(process)
            output_chunks.append(f"\n[orchestrator] {reason}\n")
            return (
                EXIT_TIMEOUT if timed_out else EXIT_IDLE_TIMEOUT,
                "".join(output_chunks),
            )

        return_code = process.wait()

    return return_code, "".join(output_chunks)


def validate_project(config: dict, profile: str) -> tuple[bool, str]:
    """Executa validação do perfil; docs/none não rodam PHP/Pint."""

    validation = config.get("validation", {})
    profiles = validation.get("profiles", {})
    profile_cfg = profiles.get(profile, profiles.get("laravel", {}))
    commands = profile_cfg.get("commands", [])

    if not commands:
        print(f"\nPerfil de validação sem comandos — pulando validação ({profile}).\n")
        return True, ""

    print(f"\nExecutando validação (perfil: {profile})...\n")

    error_chunks: list[str] = []

    for raw_command in commands:
        command = shlex.split(raw_command)
        result = run_command(command, capture_output=True)

        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)

        if result.returncode != 0:
            joined = (result.stdout or "") + (result.stderr or "")
            error_chunks.append(
                f"Comando falhou ({raw_command}), exit={result.returncode}:\n{joined}"
            )

            if validation.get("stop_on_failure", True):
                return False, "\n\n".join(error_chunks)

    if error_chunks:
        return False, "\n\n".join(error_chunks)

    return True, ""


def create_checkpoint_commit(spec: Path, step: int, profile: str, config: dict) -> bool:
    add_result = run_command(["git", "add", "--all"])

    if add_result.returncode != 0:
        return False

    diff_result = run_command(["git", "diff", "--cached", "--quiet"])

    if diff_result.returncode == 0:
        print("Nenhuma alteração encontrada para criar commit.")
        return True

    commit_types = config.get("git", {}).get("commit_types", {})
    commit_type = commit_types.get(profile, "feat")
    scope = relative_spec_path(spec).parent.name or state_id(spec)

    commit_result = run_command(
        [
            "git",
            "commit",
            "-m",
            f"{commit_type}({scope}): etapa {step} da spec",
        ]
    )

    return commit_result.returncode == 0


COMMIT_SUGGESTION_BLOCK_RE = re.compile(
    r"##\s*(?:Mensagem|Sugest[aã]o)\s+(?:para|de)\s+commit\s*\n+"
    r"(?:```[^\n]*\n)?"
    r"(?P<body>.*?)"
    r"(?:\n```|\Z)",
    re.IGNORECASE | re.DOTALL,
)

COMMIT_SUBJECT_RE = re.compile(
    r"^(?P<type>feat|fix|refactor|test|docs|chore|style|perf)"
    r"(?:\((?P<scope>[^)]+)\))?:\s*(?P<summary>.+)$",
    re.MULTILINE,
)


def _extract_section_bullets(output: str, heading: str) -> list[str]:
    pattern = re.compile(
        rf"^{re.escape(heading)}\s*:?\s*\n(?P<body>.*?)(?=\n[A-ZÁÉÍÓÚÂÊÔÃÕÜ][A-ZÁÉÍÓÚÂÊÔÃÕÜ\s]+:|\n##\s|\Z)",
        re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )
    match = pattern.search(output)
    if not match:
        return []

    bullets: list[str] = []
    for line in match.group("body").splitlines():
        stripped = line.strip()
        if stripped.startswith(("-", "*", "•")):
            text = stripped.lstrip("-*• ").strip()
            if text:
                bullets.append(text)
    return bullets


def extract_commit_suggestion_from_output(output: str) -> str | None:
    """Extrai o bloco de mensagem para commit da saída do agente, se existir."""

    match = COMMIT_SUGGESTION_BLOCK_RE.search(output)
    if not match:
        return None

    body = match.group("body").strip()
    if not body:
        return None

    # Remove fences internas residuais.
    body = re.sub(r"^```[^\n]*\n?", "", body)
    body = re.sub(r"\n```$", "", body).strip()

    if not COMMIT_SUBJECT_RE.search(body):
        return None

    return body


def list_changed_paths() -> list[str]:
    result = run_command(
        ["git", "status", "--porcelain"],
        capture_output=True,
    )
    if result.returncode != 0 or not result.stdout.strip():
        return []

    paths: list[str] = []
    for line in result.stdout.splitlines():
        if len(line) < 4:
            continue
        entry = line[3:].strip()
        if " -> " in entry:
            entry = entry.split(" -> ", 1)[1].strip()
        if entry:
            paths.append(entry)
    return paths


def build_commit_suggestion(
    *,
    spec: Path,
    step: int,
    step_title: str,
    profile: str,
    config: dict,
    agent_output: str = "",
) -> str:
    """Monta sugestão no formato da regra commit-message-suggestion."""

    from_agent = extract_commit_suggestion_from_output(agent_output)
    if from_agent:
        return from_agent

    commit_types = config.get("git", {}).get("commit_types", {})
    commit_type = commit_types.get(profile, "feat")
    # Título limpo: "Etapa 1 — Foo" -> "foo"
    title_part = step_title
    if "—" in title_part:
        title_part = title_part.split("—", 1)[1].strip()
    elif "-" in title_part and title_part.lower().startswith("etapa"):
        title_part = title_part.split("-", 1)[1].strip()

    summary = title_part[:1].lower() + title_part[1:] if title_part else f"concluir etapa {step}"
    if len(summary) > 72:
        summary = summary[:69].rstrip() + "..."

    bullets = _extract_section_bullets(agent_output, "RESUMO")
    if not bullets:
        bullets = _extract_section_bullets(agent_output, "ARQUIVOS")

    changed = list_changed_paths()
    if not bullets and changed:
        preview = changed[:5]
        bullets = [f"Alterar {path}" for path in preview]
        if len(changed) > 5:
            bullets.append(f"Incluir mais {len(changed) - 5} arquivo(s) alterado(s)")

    if not bullets:
        bullets = [
            f"Concluir a etapa {step} da spec",
            "Revisar o diff antes de versionar",
        ]

    bullets = bullets[:3]
    bullet_lines = "\n".join(f"- {item}" for item in bullets)

    if not summary.endswith((".", "!", "?")):
        summary += "."

    return f"{commit_type}: {summary}\n\n{bullet_lines}"


def print_commit_suggestion(suggestion: str) -> None:
    print("\n## Mensagem para commit\n")
    print("```")
    print(suggestion.strip())
    print("```")
    print(
        "\n(Commit automático desligado. Revise o diff e rode git commit se desejar.)\n"
    )


def execute_step(
    spec: Path,
    step: int,
    step_meta: dict[str, str],
    *,
    config: dict,
    profile: str,
    agent: str,
) -> tuple[bool, str]:
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    max_attempts = int(
        config.get("execution", {}).get("maximum_attempts_per_step", 1)
    )
    implement_template = load_prompt_template(config, profile)
    fix_template = load_prompt_template(config, profile, fix=True)

    prompt = render_prompt(
        implement_template,
        spec=spec,
        step_title=step_meta["title"],
        step_content=step_meta["content"],
    )

    last_error = ""
    last_output = ""

    for attempt in range(1, max_attempts + 1):
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        log_file = LOG_DIR / f"{state_id(spec)}-etapa-{step}-try{attempt}-{timestamp}.log"

        print(f"\n{'=' * 70}")
        print(f"Executando etapa {step} (tentativa {attempt}/{max_attempts})")
        print(f"Perfil: {profile}")
        print(f"Agente: {agent}")
        print(f"Log: {log_file}")
        print(f"{'=' * 70}\n")

        current_prompt = prompt
        if attempt > 1:
            current_prompt = render_prompt(
                fix_template,
                spec=spec,
                step_title=step_meta["title"],
                step_content=step_meta["content"],
                error_output=last_error or "Falha na tentativa anterior.",
            )

        return_code, output = run_agent(agent, current_prompt, config, log_file)
        last_output = output

        if return_code != 0:
            if return_code == EXIT_TIMEOUT:
                last_error = (
                    output
                    or f"{agent} não respondeu a tempo (timeout total). "
                    f"Ajuste {agent}.timeout_seconds em automation/config.json."
                )
                print(f"\nA etapa {step} falhou por timeout total do agente ({agent}).")
            elif return_code == EXIT_IDLE_TIMEOUT:
                last_error = (
                    output
                    or f"{agent} ficou sem produzir saída (timeout idle). "
                    f"Ajuste {agent}.idle_timeout_seconds em automation/config.json."
                )
                print(f"\nA etapa {step} falhou por timeout idle do agente ({agent}).")
            else:
                last_error = output or f"{agent} exit={return_code}"
                print(f"\nA execução da etapa {step} falhou ({agent}).")

            if attempt < max_attempts:
                print("Tentando correção...")
                continue
            return False, last_output

        ok, validation_error = validate_project(config, profile)

        if ok:
            return True, last_output

        last_error = validation_error
        print(f"\nValidação da etapa {step} falhou.")

        if attempt < max_attempts:
            print("Tentando correção com prompt de fix...")

    return False, last_output


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Executa sequencialmente as etapas de uma spec."
    )

    parser.add_argument(
        "spec",
        type=Path,
        help="Caminho da spec (.md) ou pasta contendo spec.md.",
    )

    parser.add_argument(
        "--from-step",
        type=int,
        default=None,
        help="Etapa inicial (padrão: menor etapa da spec).",
    )

    parser.add_argument(
        "--to-step",
        type=int,
        default=None,
        help="Etapa final (padrão: maior etapa da spec).",
    )

    parser.add_argument(
        "--profile",
        choices=["static", "jabot", "laravel", "docs", "none"],
        default=None,
        help="Perfil de prompt/validação (sobrescreve detecção automática).",
    )

    parser.add_argument(
        "--agent",
        choices=["codex", "claude"],
        default=None,
        help="Backend do agente (sobrescreve config execution.agent; padrão: codex).",
    )

    parser.add_argument(
        "--commit",
        action=argparse.BooleanOptionalAction,
        default=None,
        help="Cria commit local após cada etapa (padrão: config git.create_commit_after_step).",
    )

    parser.add_argument(
        "--list-steps",
        action="store_true",
        help="Lista etapas encontradas na spec e encerra.",
    )

    args = parser.parse_args()
    config = load_config()

    try:
        spec = resolve_spec_path(args.spec)
    except FileNotFoundError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

    spec_text = spec.read_text(encoding="utf-8")

    try:
        steps = parse_steps(spec_text)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

    available = sorted(steps)
    profile = detect_profile(spec, config, args.profile)
    agent = detect_agent(config, args.agent)

    if args.list_steps:
        print(f"Spec: {relative_spec_path(spec).as_posix()}")
        print(f"Perfil: {profile}")
        print(f"Agente: {agent}")
        print("Etapas:")
        for number in available:
            print(f"  {number}: {steps[number]['title']}")
        return

    from_step = args.from_step if args.from_step is not None else available[0]
    to_step = args.to_step if args.to_step is not None else available[-1]

    if from_step > to_step:
        print(
            "--from-step não pode ser maior que --to-step.",
            file=sys.stderr,
        )
        sys.exit(1)

    missing = [n for n in range(from_step, to_step + 1) if n not in steps]
    if missing:
        print(
            "Etapas ausentes na spec para o intervalo pedido: "
            + ", ".join(str(n) for n in missing),
            file=sys.stderr,
        )
        sys.exit(1)

    should_commit = args.commit
    if should_commit is None:
        should_commit = bool(
            config.get("git", {}).get("create_commit_after_step", False)
        )

    if should_commit and not config.get("git", {}).get("allow_commit", True):
        print(
            "Commits automáticos estão desabilitados por git.allow_commit=false.\n"
            "Revise a sugestão gerada e faça o commit manualmente.",
            file=sys.stderr,
        )
        sys.exit(1)

    ensure_clean_repository(config)

    state = load_state(spec)

    if not config.get("execution", {}).get("continue_from_last_state", True):
        state["completed_steps"] = []
        state["failed_step"] = None

    print(f"Spec: {relative_spec_path(spec).as_posix()}")
    print(f"Perfil: {profile}")
    print(f"Agente: {agent}")
    print(f"Etapas: {from_step} → {to_step}")
    print(f"Commit por etapa: {'sim' if should_commit else 'não'}")

    for step in range(from_step, to_step + 1):
        if step in state["completed_steps"]:
            print(f"Etapa {step} já concluída. Pulando.")
            continue

        success, agent_output = execute_step(
            spec,
            step,
            steps[step],
            config=config,
            profile=profile,
            agent=agent,
        )

        if not success:
            state["failed_step"] = step
            save_state(spec, state)

            print(
                f"\nAutomação interrompida na etapa {step}.\n"
                "Corrija o problema e execute novamente.",
                file=sys.stderr,
            )
            sys.exit(1)

        if should_commit:
            if not create_checkpoint_commit(spec, step, profile, config):
                state["failed_step"] = step
                save_state(spec, state)

                print(
                    "A implementação passou, mas o commit local falhou.",
                    file=sys.stderr,
                )
                sys.exit(1)
        else:
            suggestion = build_commit_suggestion(
                spec=spec,
                step=step,
                step_title=steps[step]["title"],
                profile=profile,
                config=config,
                agent_output=agent_output,
            )
            print_commit_suggestion(suggestion)

        state["completed_steps"].append(step)
        state["failed_step"] = None
        save_state(spec, state)

        print(f"\nEtapa {step} concluída e validada.")

    print("\nTodas as etapas solicitadas foram concluídas.")


if __name__ == "__main__":
    main()

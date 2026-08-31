# Automação de specs (orchestrator)

Executa etapa a etapa uma **spec executável** com um backend de agente (Codex CLI ou Claude Code CLI), valida o resultado conforme o perfil e (opcionalamente) cria commit local.

## Pré-requisitos

- Python 3.10+
- Repositório Git limpo (sem alterações não commitadas), salvo se `git.require_clean_repository` for `false`.
- O backend de agente escolhido (`--agent` ou `execution.agent` em `config.json`) instalado e autenticado:

### Codex (padrão)

```bash
codex --version
codex login status
codex doctor
```

Teste rápido:

```bash
codex exec --sandbox workspace-write "Responda apenas: pong"
```

### Claude Code

```bash
claude --version
```

Teste rápido:

```bash
claude -p "Responda apenas: pong" --permission-mode bypassPermissions
```

O orchestrator roda o agente em modo não interativo e sem prompts de confirmação (`--sandbox workspace-write` no Codex, `--permission-mode bypassPermissions` no Claude Code) — ambos dão ao agente liberdade para ler e escrever arquivos do repositório sem parar pedindo aprovação a cada ferramenta.

## Estrutura

```text
automation/
  orchestrator.py
  config.json
  prompts/
    implement-step-jabot.txt   # features PHP JABOT (padrão)
    implement-step.txt         # Laravel (legado, se reutilizar)
    implement-step-docs.txt
    fix-step-jabot.txt
    fix-step.txt
    fix-step-docs.txt
  state/                       # progresso por spec (gitignored)
  logs/                        # saída do agente (gitignored)
  README.md

docs/specs/
  README.md                    # índice de specs
  001-site-institucional/
    spec.md                    # etapas executáveis
    reference.md               # detalhes longos (opcional)
  002-plataforma-multitenant/
    spec.md
  referencias/                 # requisitos compartilhados, não executáveis
  adr/                         # decisões arquiteturais, não executáveis
```

## Formato da spec (obrigatório)

```markdown
## Etapa N — Título curto

### Objetivo
### Requisitos
### Critérios de aceite
```

Convenção: `docs/specs/00N-slug/spec.md` (+ `reference.md` opcional).

O orchestrator aceita o arquivo `.md` ou a pasta (resolve para `spec.md`).

## Perfis

| Perfil | Prompt | Validação pós-etapa |
|--------|--------|---------------------|
| `static` | `implement-step-static.txt` | comandos definidos no projeto/spec |
| `jabot` | `implement-step-jabot.txt` | nenhuma (agente roda `php -l`) |
| `docs` | `implement-step-docs.txt` | nenhuma |
| `laravel` | `implement-step.txt` | `php gestao/artisan test` + Pint |
| `none` | fallback | nenhuma |

Detecção automática:

1. Flag `--profile`
2. `config.json` → `validation.spec_profiles`
3. Caminho com `manual` / `dokuwiki` → `docs`
4. Senão → `validation.default_profile` (`static` neste projeto)

## Agentes

| Agente | Comando | Modo não interativo |
|--------|---------|----------------------|
| `codex` (padrão) | `codex` | `codex exec --sandbox workspace-write "<prompt>"` |
| `claude` | `claude` | `claude -p "<prompt>" --permission-mode bypassPermissions --output-format text` |

Detecção automática:

1. Flag `--agent`
2. `config.json` → `execution.agent`
3. Senão → `codex`

Cada agente tem seu próprio bloco em `config.json` (`codex` / `claude`) com `command`, `timeout_seconds` e `idle_timeout_seconds`; o bloco `claude` também define `permission_mode` e `output_format`.

## Uso

Rodar da raiz do repositório.

### Listar etapas

```bash
python3 automation/orchestrator.py docs/specs/002-plataforma-multitenant/ --list-steps
```

### Executar etapas

```bash
# Todas (agente padrão, config.json → execution.agent)
python3 automation/orchestrator.py docs/specs/002-plataforma-multitenant/

# Intervalo (ex.: só a classe)
python3 automation/orchestrator.py docs/specs/002-plataforma-multitenant/ --from-step 1 --to-step 1

# Forçando o backend Claude Code nesta execução
python3 automation/orchestrator.py docs/specs/002-plataforma-multitenant/ --agent claude
```

### Commit após cada etapa

```bash
python3 automation/orchestrator.py docs/specs/001-site-institucional/ --no-commit
```

Neste projeto, `AGENTS.md` proíbe commits automáticos. Por isso,
`git.create_commit_after_step` e `git.allow_commit` permanecem `false`; o
orquestrador apenas apresenta uma mensagem pronta para revisão e commit manual.
Também não há push automático — `allow_push` permanece desabilitado.

## Flags

| Flag | Descrição |
|------|-----------|
| `spec` | Caminho do `.md` ou pasta com `spec.md` |
| `--list-steps` | Lista etapas e perfil |
| `--from-step N` / `--to-step N` | Intervalo de etapas |
| `--profile static\|jabot\|docs\|laravel\|none` | Sobrescreve detecção |
| `--agent codex\|claude` | Sobrescreve o backend de agente (padrão: `execution.agent` do config, ou `codex`) |
| `--commit` / `--no-commit` | Solicita ou desliga commit local; `--commit` é recusado quando `git.allow_commit` é `false` |

## Fluxo interno (por etapa)

1. Monta prompt (template do perfil + conteúdo da etapa).
2. Roda o backend de agente selecionado (Codex ou Claude Code) em modo não interativo.
3. Valida conforme perfil (`jabot`: sem comandos automáticos).
4. Em falha, retenta com prompt de fix (`maximum_attempts_per_step`).
5. Marca etapa no state; opcionalmente commit ou sugere mensagem.

Estado: `automation/state/<caminho-da-spec>.json`  
Logs: `automation/logs/<id>-etapa-N-tryK-….log`

## Configuração (`config.json`)

Registrar nova spec:

```json
"spec_profiles": {
  "docs/specs/001-site-institucional/spec.md": "static"
}
```

## Fluxo recomendado

1. Inicializar o repositório Git quando o projeto estiver pronto para versionamento e criar a branch `feature/spec-00N-…`
2. Escrever `docs/specs/00N-slug/spec.md` (etapas pequenas)
3. Detalhes longos em `reference.md` na mesma pasta
4. Registrar em `docs/specs/README.md` e `config.json`
5. `git status` limpo → `--list-steps` → executar etapa(s)
6. Revisar diff e fazer o commit manualmente com a mensagem sugerida

## Exemplo deste projeto

```bash
# Site institucional (SPEC-001)
python3 automation/orchestrator.py docs/specs/001-site-institucional/ --list-steps
python3 automation/orchestrator.py docs/specs/001-site-institucional/ --from-step 1 --to-step 1
```

## Solução de problemas

| Sintoma | O que fazer |
|---------|-------------|
| `Spec não encontrada` | Confira caminho; pasta precisa de `spec.md` |
| `Nenhuma etapa encontrada` | Headings: `## Etapa N — Título` |
| Repo com alterações | Commit ou stash antes de rodar |
| Etapa pulada | Apague JSON em `automation/state/` |
| Perfil errado | `--profile jabot` ou cadastre em `spec_profiles` |
| Agente errado / CLI não encontrada | `--agent codex\|claude` ou ajuste `execution.agent` em `config.json` |

## Relação com `AGENTS.md`

O perfil `static` orienta o agente a ler `AGENTS.md` quando o arquivo existir, além da spec e de seu `reference.md`.

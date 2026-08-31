#!/usr/bin/env bash
# Deploy para Kinghost via tar + gzip + SSH (não usa rsync remoto).
# Em muitos hostings, /usr/bin/rsync remoto não é executável via SSH (erro "Permissão negada" / 126).
#
# Pré-requisito: host SSH "pastoral360" em ~/.ssh/config
#
# Uso (na raiz do repositório, ao lado de laravel/ e www/):
#   ./scripts/deploy-kinghost.sh
# Simular (só lista o que seria feito):
#   DRY_RUN=1 ./scripts/deploy-kinghost.sh
# Pular composer e artisan no servidor:
#   SKIP_REMOTE_BUILD=1 ./scripts/deploy-kinghost.sh
# Pular checagem de assets gerados em www/ (não recomendado):
#   SKIP_ASSET_CHECK=1 ./scripts/deploy-kinghost.sh
# Pular git push ao final:
#   SKIP_GIT_PUSH=1 ./scripts/deploy-kinghost.sh
#
# PHP no servidor (Laravel 12 precisa de PHP 8.2+). Se `composer` usar PHP 5.x, defina o binário certo:
#   REMOTE_PHP=php82 ./scripts/deploy-kinghost.sh
#   REMOTE_PHP=/usr/local/php82/bin/php ./scripts/deploy-kinghost.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SSH_HOST="${SSH_HOST:-pastoral360}"
REMOTE_LARAVEL="${REMOTE_LARAVEL:-/home/pastoral360/laravel}"
REMOTE_WWW="${REMOTE_WWW:-/home/pastoral360/www}"
REMOTE_PHP="${REMOTE_PHP:-php}"

DRY_RUN="${DRY_RUN:-}"
SKIP_REMOTE_BUILD="${SKIP_REMOTE_BUILD:-}"
SKIP_ASSET_CHECK="${SKIP_ASSET_CHECK:-}"
SKIP_GIT_PUSH="${SKIP_GIT_PUSH:-}"
GIT_REMOTE="${GIT_REMOTE:-origin}"

# Artefatos gerados por `npm run build` em laravel/ (saída em ../www/).
REQUIRED_WWW_ASSETS=(
  "build/manifest.json"
  "vendor/bootstrap/css/bootstrap.min.css"
  "vendor/bootstrap/js/bootstrap.bundle.min.js"
  "vendor/bootstrap-icons/font/bootstrap-icons.min.css"
  "vendor/leaflet/leaflet.css"
  "vendor/leaflet/leaflet.js"
  "css/fonts-public.css"
  "css/fonts-figtree.css"
)

check_www_assets() {
  local rel missing=()
  for rel in "${REQUIRED_WWW_ASSETS[@]}"; do
    if [[ ! -f "${ROOT}/www/${rel}" ]]; then
      missing+=("www/${rel}")
    fi
  done
  if [[ ${#missing[@]} -eq 0 ]]; then
    return 0
  fi
  echo "Erro: assets públicos ausentes (não versionados no Git; gere antes do deploy):" >&2
  for rel in "${missing[@]}"; do
    echo "  - ${rel}" >&2
  done
  echo "" >&2
  echo "Execute na máquina local:" >&2
  echo "  cd laravel && npm install && npm run build" >&2
  echo "" >&2
  echo "Ou pule esta checagem (não recomendado): SKIP_ASSET_CHECK=1 ./scripts/deploy-kinghost.sh" >&2
  return 1
}

push_to_remote() {
  if [[ -n "${SKIP_GIT_PUSH}" ]]; then
    echo "SKIP_GIT_PUSH=1: pulando git push."
    return 0
  fi

  if ! git -C "${ROOT}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Aviso: não é um repositório Git; pulando push." >&2
    return 0
  fi

  local branch="${GIT_BRANCH:-$(git -C "${ROOT}" branch --show-current)}"

  if [[ -z "${branch}" ]]; then
    echo "Erro: não foi possível detectar o branch atual para git push." >&2
    return 1
  fi

  if ! git -C "${ROOT}" diff --quiet --ignore-submodules -- 2>/dev/null \
    || ! git -C "${ROOT}" diff --cached --quiet --ignore-submodules -- 2>/dev/null; then
    echo "Aviso: há alterações locais não commitadas (o push envia apenas commits já existentes)." >&2
  fi

  if git -C "${ROOT}" rev-parse --abbrev-ref "${branch}@{upstream}" >/dev/null 2>&1; then
    local ahead
    ahead="$(git -C "${ROOT}" rev-list --count "@{upstream}..HEAD" 2>/dev/null || echo 0)"
    if [[ "${ahead}" -eq 0 ]]; then
      echo ">>> Git: branch ${branch} já está sincronizado com ${GIT_REMOTE}."
      return 0
    fi
    echo ">>> Git: enviando ${ahead} commit(s) para ${GIT_REMOTE}/${branch}..."
    git -C "${ROOT}" push "${GIT_REMOTE}" "${branch}"
  else
    echo ">>> Git: enviando branch ${branch} para ${GIT_REMOTE} (primeiro push com -u)..."
    git -C "${ROOT}" push -u "${GIT_REMOTE}" "${branch}"
  fi
}

if [[ ! -d "${ROOT}/laravel" ]] || [[ ! -d "${ROOT}/www" ]]; then
  echo "Erro: execute este script a partir da raiz do repositório (pastas laravel/ e www/ não encontradas)." >&2
  echo "ROOT atual: ${ROOT}" >&2
  exit 1
fi

# macOS: não embute xattrs (ex.: com.apple.provenance) no .tar.gz
export COPYFILE_DISABLE=1

# Extração no Linux (GNU tar): reduz avisos "LIBARCHIVE... desconhecida" ao ler arquivos criados no Mac.
# Se o tar do servidor for muito antigo, use: TAR_REMOTE_FLAGS= ./scripts/deploy-kinghost.sh
tar_extract_flags="${TAR_REMOTE_FLAGS:---warning=no-unknown-keyword}"

echo ">>> Origem:  ${ROOT}"
echo ">>> Destino: ${SSH_HOST}:${REMOTE_LARAVEL}/ e ${REMOTE_WWW}/"
echo ">>> Método:  tar.gz via SSH (sem rsync remoto)"
echo ">>> PHP no servidor (composer + artisan): ${REMOTE_PHP}"
if [[ -n "${tar_extract_flags}" ]]; then
  echo ">>> tar remoto: ${tar_extract_flags}"
fi
echo ""

if [[ -n "${DRY_RUN}" ]]; then
  echo "DRY-RUN: nada será enviado."
  echo "  0) checar www/build, www/vendor e www/css (npm run build local)"
  echo "  1) tar (laravel) excluindo vendor, node_modules, .git, .env, caches locais → ssh tar -x em ${REMOTE_LARAVEL}"
  echo "  2) rm build/vendor/css/hot/storage em www no servidor; tar (www) sem symlink storage → ssh tar -x em ${REMOTE_WWW}"
  echo "  3) composer + artisan no servidor com REMOTE_PHP=${REMOTE_PHP} (se SKIP_REMOTE_BUILD vazio)"
  echo "  4) git push para ${GIT_REMOTE} (branch atual, se SKIP_GIT_PUSH vazio)"
  exit 0
fi

if [[ -z "${SKIP_ASSET_CHECK}" ]]; then
  echo ">>> Verificando assets gerados em www/ (build, vendor, css)..."
  check_www_assets
  echo ">>> Assets OK."
  echo ""
fi

# Exclusões no pacote laravel: não sobrescrever vendor/node_modules no servidor.
# .env permanece só no servidor.
tar_laravel() {
  # COPYFILE_DISABLE reforçado no subshell (alguns ambientes só respeitam aqui)
  env COPYFILE_DISABLE=1 tar -czf - \
    --exclude='vendor' \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='storage/logs' \
    --exclude='storage/framework/cache' \
    --exclude='storage/framework/sessions' \
    --exclude='storage/framework/views' \
    --exclude='bootstrap/cache/*.php' \
    --exclude='.phpunit.result.cache' \
    --exclude='.phpunit.cache' \
    -C "${ROOT}/laravel" \
    .
}

echo ">>> Enviando laravel/ (sobrescreve arquivos; vendor e node_modules no servidor não vêm no pacote — preservados)..."
tar_laravel | ssh "${SSH_HOST}" "mkdir -p '${REMOTE_LARAVEL}' && tar ${tar_extract_flags} -xzf - -C '${REMOTE_LARAVEL}'"

echo ""
echo ">>> Limpando assets gerados em www/ no servidor e enviando www/..."
ssh "${SSH_HOST}" "rm -rf '${REMOTE_WWW}/build' '${REMOTE_WWW}/vendor' '${REMOTE_WWW}/css' '${REMOTE_WWW}/hot' '${REMOTE_WWW}/storage' 2>/dev/null || true"
env COPYFILE_DISABLE=1 tar -czf - \
  --exclude='.DS_Store' \
  --exclude='storage' \
  -C "${ROOT}/www" \
  . | ssh "${SSH_HOST}" "mkdir -p '${REMOTE_WWW}' && tar ${tar_extract_flags} -xzf - -C '${REMOTE_WWW}'"

echo ""
echo ">>> Arquivos enviados."

if [[ -n "${SKIP_REMOTE_BUILD}" ]]; then
  echo "SKIP_REMOTE_BUILD=1: pulando composer e artisan no servidor."
else
  echo ""
  echo ">>> No servidor: storage:link, composer install --no-dev, migrate e cache de config/views..."
  echo "    (REMOTE_PHP solicitado: ${REMOTE_PHP})"
  ssh "${SSH_HOST}" bash -s <<REMOTE
set -euo pipefail
cd "${REMOTE_LARAVEL}"
REQUESTED_PHP='${REMOTE_PHP}'

php_is_82_plus() {
  local bin="\$1"
  "\$bin" -r 'exit((PHP_VERSION_ID >= 80200) ? 0 : 1);' >/dev/null 2>&1
}

pick_php_bin() {
  local candidates=(
    "\$REQUESTED_PHP"
    php83 php82 php8.3 php8.2 php81 php8.1
    /usr/local/bin/php83 /usr/local/bin/php82
    /usr/local/php83/bin/php /usr/local/php82/bin/php
    /opt/cpanel/ea-php83/root/usr/bin/php
    /opt/cpanel/ea-php82/root/usr/bin/php
  )
  local c
  for c in "\${candidates[@]}"; do
    if command -v "\$c" >/dev/null 2>&1 && php_is_82_plus "\$c"; then
      command -v "\$c"
      return 0
    fi
  done
  return 1
}

PHP_BIN="\$(pick_php_bin || true)"
if [[ -z "\${PHP_BIN}" ]]; then
  echo "Erro: não encontrei PHP 8.2+ no servidor." >&2
  echo "Dica: rode com REMOTE_PHP=php82 (ou caminho absoluto do php82)." >&2
  exit 1
fi
echo ">>> PHP remoto detectado: \${PHP_BIN} (\$(\"\${PHP_BIN}\" -v | head -n 1))"

COMPOSER_BIN="\$(command -v composer || true)"
if [[ -n "\${COMPOSER_BIN}" ]]; then
  if ! "\${PHP_BIN}" "\${COMPOSER_BIN}" install --no-dev --optimize-autoloader --no-interaction; then
    echo "Aviso: composer install falhou. Continuando com storage:link/migrate para não bloquear deploy." >&2
  fi
else
  echo "Aviso: 'composer' não encontrado no PATH remoto. Pulando composer install." >&2
fi

# Sempre tenta aplicar estes passos, mesmo se composer falhar.
"\${PHP_BIN}" artisan storage:link --force 2>/dev/null || true
"\${PHP_BIN}" artisan migrate --force
"\${PHP_BIN}" artisan config:cache
"\${PHP_BIN}" artisan view:cache
REMOTE
fi

echo ""
push_to_remote

echo ""
echo ">>> Deploy finalizado."

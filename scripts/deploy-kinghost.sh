#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"
LARAVEL_SOURCE="${ROOT}/laravel"
WWW_SOURCE="${ROOT}/www"
MODE=validate
PACKAGE_DIR="${DEPLOY_PACKAGE_DIR:-${ROOT}/.deploy/package}"

usage() {
  cat <<'EOF'
Uso: scripts/deploy-kinghost.sh [--validate | --package [diretório] | --deploy]
  --validate  valida fontes e ferramentas sem alterar o servidor (padrão)
  --package   executa testes/build e monta laravel/ e www/
  --deploy    monta o pacote e publica por SSH com backup para rollback

Obrigatórias em --deploy: SSH_HOST e REMOTE_HOME (caminho absoluto).
Opcionais: REMOTE_PHP=php, RELEASE_ID, RUN_MIGRATIONS=0,
CACHE_CONFIG=1, CACHE_ROUTES=1 e CACHE_VIEWS=1.
EOF
}
die() { printf 'Erro: %s\n' "$*" >&2; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || die "comando obrigatório não encontrado: $1"; }

case "${1:---validate}" in
  --validate) [[ $# -le 1 ]] || die "argumentos extras para --validate" ;;
  --package) MODE=package; [[ $# -le 2 ]] || die "argumentos extras para --package"; PACKAGE_DIR="${2:-${PACKAGE_DIR}}" ;;
  --deploy) MODE=deploy; [[ $# -eq 1 ]] || die "argumentos extras para --deploy" ;;
  --help|-h) usage; exit 0 ;;
  *) usage >&2; die "modo desconhecido: $1" ;;
esac

[[ -d "${LARAVEL_SOURCE}" && -f "${LARAVEL_SOURCE}/artisan" ]] || die "origem Laravel inválida: ${LARAVEL_SOURCE}"
[[ -d "${WWW_SOURCE}" && -f "${WWW_SOURCE}/index.php" ]] || die "origem pública inválida: ${WWW_SOURCE}"
[[ "${PACKAGE_DIR}" == /* ]] || PACKAGE_DIR="${ROOT}/${PACKAGE_DIR}"
[[ "${PACKAGE_DIR}" != "${ROOT}" && "${PACKAGE_DIR}" != "${LARAVEL_SOURCE}" && "${PACKAGE_DIR}" != "${WWW_SOURCE}" ]] || die "destino de pacote inseguro"
require_command tar
require_command find

if [[ "${MODE}" == deploy ]]; then
  : "${SSH_HOST:?Erro: SSH_HOST é obrigatório para --deploy}"
  : "${REMOTE_HOME:?Erro: REMOTE_HOME é obrigatório para --deploy}"
  [[ "${REMOTE_HOME}" =~ ^/[A-Za-z0-9._/-]+$ && "${REMOTE_HOME}" != / && "${REMOTE_HOME}" != *..* ]] || die "REMOTE_HOME deve ser absoluto e seguro"
  [[ "${SSH_HOST}" =~ ^[A-Za-z0-9._@-]+$ ]] || die "SSH_HOST contém caracteres inválidos"
  [[ "${REMOTE_PHP:-php}" =~ ^[A-Za-z0-9._/-]+$ ]] || die "REMOTE_PHP contém caracteres inválidos"
  for toggle in "${RUN_MIGRATIONS:-0}" "${CACHE_CONFIG:-1}" "${CACHE_ROUTES:-1}" "${CACHE_VIEWS:-1}"; do
    [[ "${toggle}" == 0 || "${toggle}" == 1 ]] || die "opções RUN_MIGRATIONS/CACHE_* aceitam somente 0 ou 1"
  done
  require_command ssh
fi

printf 'Origem do núcleo: %s\nOrigem pública:    %s\n' "${LARAVEL_SOURCE}" "${WWW_SOURCE}"
if [[ "${MODE}" == deploy ]]; then
  printf 'Destino remoto:    %s:%s/{laravel,www}\n' "${SSH_HOST}" "${REMOTE_HOME}"
else
  printf 'Destino do pacote: %s/{laravel,www}\n' "${PACKAGE_DIR}"
fi
if [[ "${MODE}" == validate ]]; then
  echo 'Validação concluída. Nenhum arquivo local ou remoto foi alterado.'
  exit 0
fi

require_command php; require_command npm; require_command composer
echo '>>> Validando dependências PHP...'
(cd "${LARAVEL_SOURCE}" && composer validate --no-check-publish --strict)
echo '>>> Executando testes Laravel...'
(cd "${LARAVEL_SOURCE}" && php artisan test)
echo '>>> Instalando dependências Node e gerando build de produção...'
(cd "${LARAVEL_SOURCE}" && npm install --no-audit --no-fund && npm run build)
[[ -f "${WWW_SOURCE}/build/manifest.json" ]] || die "build não gerou www/build/manifest.json"

staging="$(mktemp -d "${TMPDIR:-/tmp}/pastoral360-deploy.XXXXXX")"
cleanup() { rm -rf -- "${staging}"; }
trap cleanup EXIT
mkdir -p "${staging}/laravel" "${staging}/www"
env COPYFILE_DISABLE=1 tar -cf - \
  --exclude='.env' --exclude='.env.*' --exclude='.git' \
  --exclude='tests' --exclude='phpunit.xml' --exclude='.phpunit.result.cache' \
  --exclude='vendor' --exclude='node_modules' \
  --exclude='storage/logs/*' --exclude='storage/framework/cache/*' \
  --exclude='storage/framework/sessions/*' --exclude='storage/framework/views/*' \
  --exclude='bootstrap/cache/*.php' -C "${LARAVEL_SOURCE}" . | tar -xf - -C "${staging}/laravel"

# Allowlist pública: nenhum fonte privado pode entrar em www/ por acidente.
for item in index.php .htaccess build; do
  [[ -e "${WWW_SOURCE}/${item}" ]] || die "arquivo público obrigatório ausente: www/${item}"
  cp -R "${WWW_SOURCE}/${item}" "${staging}/www/"
done
if find "${staging}/www" -type f \( -name '.env*' -o -name artisan -o -name 'composer.*' -o -name phpunit.xml \) -print -quit | grep -q .; then
  die "arquivo privado detectado no pacote público"
fi
find "${staging}" -type l -print -quit | grep -q . && die "links simbólicos não são permitidos no pacote"

[[ ! -e "${PACKAGE_DIR}" ]] || die "destino do pacote já existe; escolha um diretório novo: ${PACKAGE_DIR}"
mkdir -p "${PACKAGE_DIR}"
cp -R "${staging}/laravel" "${staging}/www" "${PACKAGE_DIR}/"
printf 'Pacote validado em %s\n' "${PACKAGE_DIR}"
[[ "${MODE}" == deploy ]] || exit 0

REMOTE_PHP="${REMOTE_PHP:-php}"
RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
[[ "${RELEASE_ID}" =~ ^[A-Za-z0-9._-]+$ ]] || die "RELEASE_ID contém caracteres inválidos"
remote_release="${REMOTE_HOME}/releases/${RELEASE_ID}"
echo '>>> Enviando release isolada; destinos ativos ainda não serão alterados...'
tar -czf - -C "${PACKAGE_DIR}" laravel www | ssh "${SSH_HOST}" \
  "set -eu; test ! -e '${remote_release}'; mkdir -p '${remote_release}'; tar -xzf - -C '${remote_release}'"

ssh "${SSH_HOST}" bash -s -- "${REMOTE_HOME}" "${RELEASE_ID}" "${REMOTE_PHP}" <<'REMOTE_PREPARE'
set -Eeuo pipefail
home="$1"; id="$2"; php_bin="$3"; release="${home}/releases/${id}"
test -d "${release}/laravel" && test -d "${release}/www"
command -v "${php_bin}" >/dev/null
"${php_bin}" -r 'exit(PHP_VERSION_ID >= 80200 ? 0 : 1);'
composer_bin="$(command -v composer)"
mkdir -p "${home}/shared"
if [[ ! -e "${home}/shared/.env" && -f "${home}/laravel/.env" ]]; then cp -p "${home}/laravel/.env" "${home}/shared/.env"; fi
if [[ ! -e "${home}/shared/storage" && -d "${home}/laravel/storage" ]]; then cp -a "${home}/laravel/storage" "${home}/shared/storage"; fi
mkdir -p "${home}/shared/storage/app/public" "${home}/shared/storage/framework/cache/data" \
  "${home}/shared/storage/framework/sessions" "${home}/shared/storage/framework/views" "${home}/shared/storage/logs"
test -f "${home}/shared/.env" || { echo 'Erro: crie ~/shared/.env antes da publicação.' >&2; exit 1; }
ln -s "${home}/shared/.env" "${release}/laravel/.env"
rm -rf "${release}/laravel/storage"
ln -s "${home}/shared/storage" "${release}/laravel/storage"
cd "${release}/laravel"
"${php_bin}" "${composer_bin}" install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-progress
"${php_bin}" artisan about --only=environment
REMOTE_PREPARE

echo '>>> Ativando release com backup do código atual...'
ssh "${SSH_HOST}" env CACHE_CONFIG="${CACHE_CONFIG:-1}" CACHE_ROUTES="${CACHE_ROUTES:-1}" \
  CACHE_VIEWS="${CACHE_VIEWS:-1}" RUN_MIGRATIONS="${RUN_MIGRATIONS:-0}" \
  bash -s -- "${REMOTE_HOME}" "${RELEASE_ID}" "${REMOTE_PHP}" <<'REMOTE_ACTIVATE'
set -Eeuo pipefail
home="$1"; id="$2"; php_bin="$3"; release="${home}/releases/${id}"; backup="${home}/releases/rollback-${id}"
mkdir -p "${backup}"; activated=0
rollback() {
  status=$?
  if [[ $status -ne 0 && $activated -eq 1 ]]; then
    rm -rf "${home}/laravel" "${home}/www"
    [[ ! -d "${backup}/laravel" ]] || mv "${backup}/laravel" "${home}/laravel"
    [[ ! -d "${backup}/www" ]] || mv "${backup}/www" "${home}/www"
    echo 'Falha após ativação; código anterior restaurado.' >&2
  fi
  exit $status
}
trap rollback EXIT
[[ ! -e "${home}/laravel" ]] || mv "${home}/laravel" "${backup}/laravel"
[[ ! -e "${home}/www" ]] || mv "${home}/www" "${backup}/www"
mv "${release}/laravel" "${home}/laravel"; mv "${release}/www" "${home}/www"; activated=1
ln -s '../laravel/storage/app/public' "${home}/www/storage"
cd "${home}/laravel"
"${php_bin}" artisan optimize:clear
[[ "${RUN_MIGRATIONS}" != 1 ]] || "${php_bin}" artisan migrate --force
[[ "${CACHE_CONFIG}" != 1 ]] || "${php_bin}" artisan config:cache
[[ "${CACHE_ROUTES}" != 1 ]] || "${php_bin}" artisan route:cache
[[ "${CACHE_VIEWS}" != 1 ]] || "${php_bin}" artisan view:cache
chmod -R ug+rwX storage bootstrap/cache
activated=0; trap - EXIT
printf 'Deploy %s concluído. Backup: %s\n' "${id}" "${backup}"
REMOTE_ACTIVATE

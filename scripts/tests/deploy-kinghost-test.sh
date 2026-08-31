#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
SCRIPT="${ROOT}/scripts/deploy-kinghost.sh"
PACKAGE="$(mktemp -d "${TMPDIR:-/tmp}/pastoral360-package-test.XXXXXX")"
trap 'rm -rf -- "${PACKAGE}"' EXIT
fail() { echo "FALHOU: $*" >&2; exit 1; }

# O teste do contrato de pacote não reinstala ferramentas: os gates reais são
# executados separadamente pela suíte. Os dublês apenas permitem chegar à cópia.
mkdir -p "${PACKAGE}/bin"
for command_name in composer npm php; do
  printf '#!/usr/bin/env bash\nexit 0\n' >"${PACKAGE}/bin/${command_name}"
  chmod +x "${PACKAGE}/bin/${command_name}"
done

output="$(${SCRIPT} --validate)"
grep -q 'Nenhum arquivo local ou remoto foi alterado' <<<"${output}" || fail "simulação não confirmada"
if SSH_HOST=example.invalid REMOTE_HOME=/ "${SCRIPT}" --deploy >/dev/null 2>&1; then
  fail "REMOTE_HOME inseguro foi aceito"
fi

printf '#!/usr/bin/env bash\nexit 9\n' >"${PACKAGE}/bin/npm"
if PATH="${PACKAGE}/bin:${PATH}" DEPLOY_PACKAGE_DIR="${PACKAGE}/build-failed" "${SCRIPT}" --package >/dev/null 2>&1; then
  fail "falha de build foi ignorada"
fi
[[ ! -e "${PACKAGE}/build-failed" ]] || fail "falha de build criou pacote"
printf '#!/usr/bin/env bash\nexit 0\n' >"${PACKAGE}/bin/npm"

PATH="${PACKAGE}/bin:${PATH}" DEPLOY_PACKAGE_DIR="${PACKAGE}/artifact" "${SCRIPT}" --package

[[ -f "${PACKAGE}/artifact/laravel/artisan" ]] || fail "artisan ausente"
[[ -f "${PACKAGE}/artifact/www/index.php" ]] || fail "front controller ausente"
[[ -f "${PACKAGE}/artifact/www/.htaccess" ]] || fail ".htaccess ausente"
[[ -f "${PACKAGE}/artifact/www/build/manifest.json" ]] || fail "manifesto Vite ausente"
for excluded in laravel/.env laravel/tests laravel/vendor laravel/node_modules www/storage; do
  [[ ! -e "${PACKAGE}/artifact/${excluded}" ]] || fail "conteúdo excluído presente: ${excluded}"
done
private="$(find "${PACKAGE}/artifact/www" -type f \( -name '.env*' -o -name artisan -o -name 'composer.*' -o -name phpunit.xml \) -print -quit)"
[[ -z "${private}" ]] || fail "arquivo privado público: ${private}"
echo 'OK: contrato do deploy e conteúdo do pacote validados.'

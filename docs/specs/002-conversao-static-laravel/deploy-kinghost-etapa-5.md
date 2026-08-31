# Deploy reproduzível na Kinghost

O deploy mantém o núcleo em `~/laravel`, o document root em `~/www` e dados
persistentes em `~/shared`. Ele parte da raiz detectada do repositório, executa
testes e build antes do envio e não executa operações Git.

## Primeira publicação

Instale localmente PHP 8.2+, Composer, Node.js/npm e as dependências. Na
Kinghost, confirme PHP 8.2+, Composer e SSH. Crie o `.env` somente no servidor,
usando `laravel/.env.example` como referência, sem copiar segredos ao Git:

```bash
mkdir -p ~/shared/storage/{app/public,framework/cache/data,framework/sessions,framework/views,logs}
cp ~/laravel/.env ~/shared/.env # somente ao migrar instalação existente
chmod 600 ~/shared/.env
chmod -R ug+rwX ~/shared/storage
```

Em conta nova, crie `~/shared/.env` diretamente no servidor e gere `APP_KEY`
em uma instalação temporária ligada a ele. Usuário SSH e processo PHP devem
compartilhar o grupo gravável. `storage/` e `bootstrap/cache/` precisam permitir
escrita desse grupo; nunca use `777`.

Valide sem modificar arquivos nem conectar ao servidor:

```bash
./scripts/deploy-kinghost.sh --validate
```

Faça um ensaio completo. Ele valida Composer, executa testes Laravel, instala as
dependências declaradas com `npm install`,
build de produção e inspeciona o conteúdo público:

```bash
./scripts/deploy-kinghost.sh --package /tmp/pastoral360-package
find /tmp/pastoral360-package -type f | sort
```

## Publicação e atualizações

Defina os destinos explicitamente. `REMOTE_HOME` deve ser absoluto; dele são
derivados apenas `laravel/`, `www/`, `shared/` e `releases/`.

```bash
SSH_HOST=pastoral360 REMOTE_HOME=/home/usuario REMOTE_PHP=php82 \
  ./scripts/deploy-kinghost.sh --deploy
```

O pacote exclui `.env`, Git, testes, caches, logs, `vendor` e `node_modules`.
Composer instala somente dependências de produção numa release isolada. A
ativação move o código anterior para `~/releases/rollback-<id>` e liga o novo
código ao `.env` e storage compartilhados. `www/` usa allowlist e o link público
de storage é recriado.

Caches de configuração, rotas e views são recriados por padrão. Se o ambiente
for incompatível, desative apenas o correspondente com `CACHE_CONFIG=0`,
`CACHE_ROUTES=0` ou `CACHE_VIEWS=0`. Falha após ativação restaura o código
anterior automaticamente.

Migrations não rodam por padrão: banco não é exigido nesta etapa e rollback de
código não reverte schema. Quando uma atualização futura exigir migrations,
faça backup verificado, use alterações retrocompatíveis e defina
`RUN_MIGRATIONS=1`.

## Manutenção e rollback

Use a manutenção da hospedagem ou `php ~/laravel/artisan down --retry=60` antes
de alterações não retrocompatíveis, garantindo `artisan up` ao terminar. Logs
ficam em `~/shared/storage/logs` e sobrevivem às publicações.

Para rollback manual, use o ID informado pelo deploy. A troca abaixo afeta
somente código; `~/shared/.env`, storage e banco permanecem intactos:

```bash
RELEASE_ID=20260830T120000Z
mv ~/laravel ~/releases/failed-${RELEASE_ID}-laravel
mv ~/www ~/releases/failed-${RELEASE_ID}-www
mv ~/releases/rollback-${RELEASE_ID}/laravel ~/laravel
mv ~/releases/rollback-${RELEASE_ID}/www ~/www
php ~/laravel/artisan optimize:clear
php ~/laravel/artisan config:cache
```

Confirme a página inicial e logs antes de remover releases antigas. Nunca
remova `~/shared`; banco só deve ser restaurado separadamente a partir de backup
validado quando alguma migration tiver sido executada.

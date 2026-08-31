# Pastoral 360

Site institucional em Laravel 12. O núcleo privado da aplicação fica em
`laravel/`; o document root publicável é exclusivamente `www/`. O template e
seus assets-fonte migrados ficam em `laravel/resources/`. A cópia estática da
raiz permanece temporariamente como baseline até a validação visual final
registrada na Etapa 6.

## Requisitos

- PHP 8.2 ou superior com as extensões `pdo`, `mbstring`, `openssl`,
  `tokenizer`, `xml`, `ctype`, `json` e `bcmath`;
- Composer;
- Node.js e npm;
- PostgreSQL em produção ou SQLite para desenvolvimento e testes locais.

## Instalação local

Na raiz do repositório:

```bash
cd laravel
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
```

No `.env` local, use `DB_CONNECTION=sqlite`, informe em `DB_DATABASE` o caminho
absoluto de `laravel/database/database.sqlite`, desative
`APP_FORCE_HTTPS` e deixe `APP_CANONICAL_HOST` vazio. O `.env` é local, contém
segredos e nunca deve ser versionado.

O site não depende de banco, mas as migrations podem ser preparadas com:

```bash
php artisan migrate
```

## Execução e desenvolvimento

Em um terminal, dentro de `laravel/`:

```bash
php artisan serve
```

Em outro terminal, também em `laravel/`, inicie o Vite:

```bash
npm run dev
```

Acesse `http://127.0.0.1:8000`. O Laravel está configurado para usar `www/`
como diretório público mesmo quando iniciado por `artisan serve`.

## Build e validações

Gere os assets de produção:

```bash
cd laravel
npm run build
```

O build cria `www/build/`. Para renderizar a página pelo Laravel e validar o
resultado junto aos assets do build, rode na raiz do repositório:

```bash
node scripts/validate.mjs
```

Essa verificação não exige servidor HTTP: ela lê o HTML renderizado, valida links internos, títulos,
atributos acessíveis e conteúdo, e confirma que todos os assets locais
existem. Para validar uma origem publicada e suas respostas HTTP, passe a URL
como argumento, por exemplo `node scripts/validate.mjs https://example.com/`.

Execute a suíte completa e o formatador em modo de verificação:

```bash
cd laravel
php artisan test
./vendor/bin/pint --test
```

Valide também o fluxo de empacotamento sem acessar a hospedagem:

```bash
scripts/tests/deploy-kinghost-test.sh
./scripts/deploy-kinghost.sh --validate
```

## Configuração de produção

Use `laravel/.env.example` como referência e crie o `.env` apenas no servidor.
Defina `APP_URL`, `APP_FORCE_HTTPS`, `APP_CANONICAL_HOST`, sessão, cache, logs e
PostgreSQL conforme o ambiente. Mantenha `APP_DEBUG=false`. Garanta escrita pelo
usuário do PHP em `laravel/storage/` e `laravel/bootstrap/cache/`, sem usar
permissão `777`.

O document root deve apontar somente para `www/`. Não publique `laravel/` como
diretório acessível pela web. Detalhes de ambientes e segurança estão em
[`ambientes-etapa-4.md`](docs/specs/002-conversao-static-laravel/ambientes-etapa-4.md).

## Deploy na Kinghost

Valide as origens sem alterar arquivos locais ou remotos:

```bash
./scripts/deploy-kinghost.sh --validate
```

Faça um ensaio completo em um diretório novo:

```bash
./scripts/deploy-kinghost.sh --package /tmp/pastoral360-package
```

Para publicar, configure o host SSH e o caminho absoluto da conta:

```bash
SSH_HOST=pastoral360 REMOTE_HOME=/home/usuario REMOTE_PHP=php82 \
  ./scripts/deploy-kinghost.sh --deploy
```

O script executa testes e build antes de montar `~/laravel` e `~/www`, preserva
`.env` e storage compartilhados e mantém backup do código para rollback. O
procedimento completo de primeira publicação, atualização, manutenção e rollback
está em
[`deploy-kinghost-etapa-5.md`](docs/specs/002-conversao-static-laravel/deploy-kinghost-etapa-5.md).

## Paridade da migração

A comparação final com o baseline estático, incluindo larguras, preferências de
movimento, acessibilidade, SEO, interações e diferenças técnicas inevitáveis,
está registrada em
[`paridade-etapa-6.md`](docs/specs/002-conversao-static-laravel/paridade-etapa-6.md).

## Contato

O WhatsApp é o único canal de conversão da página. Número e mensagens ficam em
`laravel/resources/js/app.js`; o botão flutuante permanece disponível durante a
navegação.

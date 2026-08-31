# Ambientes e segurança do document root

O document root do domínio deve apontar exclusivamente para `www/`. O diretório
irmão `laravel/` contém a aplicação, dependências, testes, logs, configuração e
storage privado e nunca deve ficar abaixo da raiz pública.

## Desenvolvimento local

Copie `laravel/.env.example` para `laravel/.env`, gere uma chave própria e ajuste
somente a cópia local. Para HTTP local, use `APP_ENV=local`, `APP_DEBUG=true`,
`APP_URL=http://localhost:8000`, `APP_FORCE_HTTPS=false`, deixe
`APP_CANONICAL_HOST` vazio e use `SESSION_SECURE_COOKIE=false`.

SQLite não exige serviço externo: use `DB_CONNECTION=sqlite` e defina
`DB_DATABASE` com o caminho absoluto de `laravel/database/database.sqlite`.
Crie esse arquivo vazio antes das migrations. Sessão e cache podem permanecer
em arquivos (`SESSION_DRIVER=file` e `CACHE_STORE=file`), e logs em
`LOG_CHANNEL=stack`, `LOG_STACK=single`, `LOG_LEVEL=debug`.

Os testes já isolam banco, sessão e cache com SQLite em memória, `array` e
`array`, respectivamente. Execute-os dentro de `laravel/` com `php artisan test`.

## Produção em hospedagem compartilhada

Use uma configuração equivalente à abaixo no `.env` privado do servidor, sem
versionar valores reais:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com
APP_FORCE_HTTPS=true
APP_CANONICAL_HOST=example.com

LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=warning

SESSION_DRIVER=file
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
CACHE_STORE=file

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pastoral360
DB_USERNAME=pastoral360
DB_PASSWORD=
DB_SSLMODE=require
```

Preencha credenciais somente no servidor. PostgreSQL é o banco recomendado em
produção. Drivers de sessão/cache em arquivo evitam depender das tabelas de
banco nesta fase; `storage/framework` e `storage/logs` precisam ser graváveis
pelo PHP e permanecem fora de `www/`. O canal `daily` limita a retenção conforme
`LOG_DAILY_DAYS` (padrão de 14 dias).

Se a hospedagem termina TLS em um proxy, informe apenas os IPs/CIDRs confiáveis
em `TRUSTED_PROXIES`, separados por vírgula. O proxy deve encaminhar
`X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Port` e
`X-Forwarded-Proto`; nunca use `*` em produção. Assim HTTPS, URLs canônicas e
cookies seguros são reconhecidos sem aceitar headers forjados da internet.

`APP_CANONICAL_HOST` deve conter somente host e porta opcional, sem esquema ou
caminho. Quando configurado, acessos por outro host recebem redirecionamento
301. `APP_FORCE_HTTPS=true` faz o mesmo para HTTP. Após alterar variáveis,
limpe/recrie o cache de configuração com `php artisan config:clear` e, quando
apropriado, `php artisan config:cache`.

## Erros e verificação

Em produção, mantenha obrigatoriamente `APP_ENV=production` e `APP_DEBUG=false`.
As páginas `404` e `500` são genéricas e não exibem exceções, stack traces,
caminhos internos ou variáveis de ambiente; detalhes ficam apenas nos logs
privados. Verifique também que o servidor respeita `www/.htaccess` e os headers
de segurança. Se `mod_headers` não estiver disponível, a aplicação ainda inclui
os headers nas respostas processadas pelo front controller.

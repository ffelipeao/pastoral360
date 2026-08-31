# 6. Rotas, site público e implantação

## 6.1 Contrato de URLs

```text
GET  /                              site raiz estático
GET  /gestao/login                  autenticação
POST /gestao/login
POST /gestao/logout
GET  /gestao                        seleção de Tenant ou dashboard
GET  /gestao/plataforma/tenants     administração SaaS
POST /gestao/tenant/{tenant}/ativar troca autorizada de Tenant
GET  /gestao/congregacoes           congregações do Tenant ativo
GET  /gestao/{modulo}               módulos autorizados
GET  /site/{tenant:slug}            site público
GET  /site/{slug}/eventos/{evento}  evento público
POST /site/{slug}/eventos/{evento}/inscricoes
```

As rotas públicas devem aparecer depois das rotas fixas ou usar constraints de slug. Slugs reservados: `gestao`, `admin`, `login`, `logout`, `api`, `site`, `storage`, `build`, `assets`, `up` e demais caminhos técnicos.

## 6.2 Geração de URLs

- Usar rotas nomeadas.
- Não concatenar `APP_URL` manualmente.
- Assets da aplicação devem funcionar sob `/gestao` e `/site`.
- Links do site público usam URL canônica com slug.
- Mudança de slug exige histórico e redirecionamento 301, ou deve ser bloqueada após publicação.

## 6.3 Implantação no mesmo domínio

O document root contém o site estático. O servidor encaminha apenas `/gestao/*` e `/site/*` ao front controller Laravel.

```text
public_html/
  index.html
  assets-do-site-raiz/
  gestao/index.php       -> bootstrap seguro da aplicação

aplicacao/
  app/
  bootstrap/
  config/
  public/build/
  routes/
  storage/
  vendor/
```

Em Nginx, usar `location` dedicados. Em Apache compartilhado, usar regras `RewriteRule` testadas no ambiente de hospedagem. O código, `.env`, `storage` privado e `vendor` não devem ficar navegáveis.

Antes de assumir que a hospedagem suporta essa topologia, deve ser feita uma prova com:

- `/` entregando `index.html`;
- `/gestao/login` chegando ao Laravel;
- `/site/demo` chegando ao Laravel;
- assets e uploads funcionando em ambos os prefixos;
- URLs inexistentes em `/` não sendo capturadas indevidamente pela aplicação.

## 6.4 Configuração

- cookies de sessão limitados ao necessário; recomenda-se caminho `/gestao` para a sessão administrativa;
- cookie `Secure`, `HttpOnly` e `SameSite=Lax` ou mais restritivo;
- CSRF em todas as mutações web;
- `APP_DEBUG=false` em produção;
- filas e scheduler com processo monitorado;
- backups do banco e arquivos por política documentada;
- health check da aplicação separado do site estático.

## 6.5 Armazenamento público e privado

```text
tenants/000001/site/logos/
tenants/000001/site/carrossel/
tenants/000001/site/eventos/
tenants/000001/congregacoes/{id}/pessoas/
```

Imagens realmente públicas podem ser servidas por URL pública não enumerável ou CDN. Documentos e fotos privadas devem passar por autorização ou URLs assinadas. O sistema não deve expor disco privado via symlink genérico.

## 6.6 Operação

- deploy versionado e reversível;
- migrations compatíveis com rolling deploy quando aplicável;
- log estruturado com request ID, Tenant ID, usuário e congregação, sem dados sensíveis;
- alertas para erros, jobs falhos e tentativas repetidas de acesso negado;
- restauração de backup testada periodicamente.

## 6.7 PostgreSQL, pooling e backup

- `schema_name` vem somente de `landlord.tenants` e nunca de URL/formulário.
- Inicializar e resetar `search_path` em toda unidade de trabalho, inclusive exception.
- Pool transaction exige `SET LOCAL` e consultas na mesma transação.
- Backup completo protege o cluster; export individual usa `pg_dump --schema=tenant_000015` com alvo confiável.
- Restauração individual ocorre primeiro em schema temporário e só substitui o destino após validação.

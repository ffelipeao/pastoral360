# 5. Modelo de dados por schema

## 5.1 Schema global `landlord`

### `tenants`

- `id`, `uuid`, `name`, `slug`, `schema_name` único;
- `status`: `provisioning`, `trial`, `active`, `past_due`, `suspended`, `cancelled`, `pending_deletion`, `deleted`, `provisioning_failed`;
- plano/assinatura, retenção, `provisioned_at` e timestamps.

`schema_name` deriva do ID interno (`tenant_000001`), nunca de nome ou slug.

Outras tabelas globais: `users`, `tenant_users` N:N, `plans`, `subscriptions`, `billing`, `platform_settings`, `feature_flags`, `tenant_migrations`, `support_access_grants` e `platform_audit_logs`.

## 5.2 Cada Tenant Schema

### `congregacoes`

- `id` local, tipo `matriz|filial` e todos os campos atuais de igreja;
- garantia de exatamente uma matriz ativa.

### Autorização interna

- `tenant_user_profiles`: referência lógica a `landlord.tenant_users.id`, papel e status;
- `user_congregacoes`, `papeis`, `capacidades`, `papel_capacidades`;
- `all_congregacoes` para papéis gerais.

Evitar FK cross-schema; referências landlord são validadas pela aplicação.

### Conteúdo e operação

- `configuracoes_site`, `imagens_carrossel`, `mensagens_pastorais`;
- `cultos`, `eventos`, `inscricoes_evento`;
- `pessoas`, `visitantes`, `criancas`;
- `candidatos_batismo`, `registros_batismo`;
- `tipos_receita`, `tipos_despesa`, `movimentos_financeiros`;
- catálogos auxiliares semeados por Tenant.

Tabelas internas não repetem `tenant_id`; registros locais recebem `congregacao_id`. Evento geral usa `congregacao_id = null` e `escopo = tenant`.

## 5.3 Tesouraria

`movimentos_financeiros` contém congregação, `tipo_movimento`, categoria, descrição, valor decimal, data, pessoa opcional, status, autor/cancelador e timestamps. Uma linha representa entrada ou saída.

## 5.4 Auditoria

Auditoria operacional pode ficar no Tenant Schema. Eventos SaaS/suporte ficam no landlord com `tenant_id`, ator, congregação opcional, ação e recurso. Dados sensíveis não entram no payload.

## 5.5 Global e Tenant Migrations

- Global migrations executam uma vez no landlord.
- Tenant Migrations executam no provisioning e em todos os Tenants a cada versão.
- A fonte escolhida é `landlord.tenant_migrations`: `tenant_id`, migration, checksum, batch, status, tentativas, início, fim e erro sanitizado.
- O controle central identifica schemas atrasados mesmo se estiverem indisponíveis. Uma tabela local pode ser verificação secundária.
- Execuções usam lock, idempotência/retry, contexto isolado e só registram sucesso após commit.

## 5.6 Regras

- Unicidades naturais/legadas são locais ao Tenant Schema.
- Slug e `schema_name` são únicos no landlord.
- Valores financeiros são decimal; horários em UTC.
- Tenants/congregações são desativados, não apagados em cascata.

## 5.7 Mapeamento do legado

| Atual | Novo |
|---|---|
| configuração singleton | `configuracoes_site` no Tenant Schema |
| `igrejas` | `congregacoes` do Tenant |
| `is_sede` | `tipo = matriz` |
| `igreja_usuario` | `landlord.tenant_users` + `user_congregacoes` |
| `acesso_todas_igrejas` | todas as congregações do Tenant |
| `role = admin/user` | platform admin separado do papel eclesiástico |
| conteúdo global | conteúdo no Tenant Schema |
| culto com igreja nula | culto da matriz |

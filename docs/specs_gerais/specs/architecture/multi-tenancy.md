# Arquitetura multi-tenant por schema PostgreSQL

## 1. Conceito e decisão

Tenant é a igreja ou ministério contratante inteiro. Matriz e filiais são congregações dentro do mesmo Tenant Schema. O Pastoral360 usa schema `landlord` central e schemas `tenant_000001`, `tenant_000002`, etc. O nome físico deriva exclusivamente do ID interno imutável.

```text
PostgreSQL
├─ landlord
│  ├─ tenants, users, tenant_users
│  ├─ plans, subscriptions, billing
│  ├─ feature_flags, tenant_migrations
│  └─ platform_audit_logs, support_access_grants
├─ tenant_000001
│  ├─ congregacoes, pessoas, visitantes, criancas
│  ├─ batismos, cultos, eventos, inscricoes
│  ├─ movimentos_financeiros
│  └─ configuracoes_site e conteúdo
└─ tenant_000002
```

## 2. Global versus Tenant

| Landlord | Tenant Schema | Justificativa |
|---|---|---|
| Tenants/status | Congregações | estrutura do cliente |
| usuários/credenciais | perfis e congregações permitidas | identidade N:N; autorização contextual |
| tenant_users/convites | pessoas e secretaria | dados do cliente |
| planos/assinaturas/billing | eventos, cultos e site | operação da igreja |
| flags/migrations/auditoria SaaS | tesouraria | dado financeiro sensível |
| concessões de suporte | auditoria operacional | suporte controlado |

Catálogos do domínio são semeados por Tenant para evitar joins cross-schema. Relatórios globais usam métricas agregadas ou anonimizadas produzidas intencionalmente.

## 3. Componentes Laravel

```php
interface TenantResolver
{
    public function resolve(Request $request): ?Tenant;
}

final class TenantContext
{
    public function set(Tenant $tenant): void;
    public function current(): ?Tenant;
    public function clear(): void;
}
```

- `Tenant`: modelo landlord e fonte única de `schema_name`.
- `TenantResolver`: resolve slug público, seleção autenticada ou vínculo único.
- `TenantManager`: valida e orquestra ativação/encerramento.
- `TenantContext`: guarda Tenant da unidade de trabalho.
- `TenantConnectionManager`: configura e restaura conexão/`search_path`.
- `TenantMiddleware`: garante ciclo completo inclusive em exception.
- `TenantProvisioningService`: cria schema, migra, semeia e compensa.

Controllers e domínio nunca resolvem schema. Repositórios usam a conexão tenant ativa. Isso permite banco dedicado futuramente.

## 4. Resolução, autenticação e middleware

Público: `/site/{slug}` consulta `landlord.tenants`. Gestão: Tenant selecionado na sessão e revalidado em `tenant_users`; vínculo único permite seleção automática. Futuro subdomínio usa o mesmo resolver.

```text
Authenticate landlord
→ ResolveTenant
→ ValidateTenantAccess/status
→ InitializeTenantSchema
→ carregar RBAC e congregações
→ Request
→ ClearTenantContext em finally
```

Usuário N:N pode trocar apenas para Tenant com vínculo ativo. Site público exige Tenant ativo e publicação antes de inicializar schema.

## 5. PostgreSQL e connection pooling

É proibido interpolar Request em `SET search_path`. O manager recebe objeto `Tenant`, valida `schema_name` contra `^tenant_[0-9]{6,}$` e aplica quoting seguro.

- Em transação: `SET LOCAL search_path TO "tenant_000015", landlord`.
- Fora de transação: conexão dedicada/configurada e `RESET search_path` em `finally`.
- Landlord usa conexão explícita, sem depender de resolução ambígua.
- Pool transaction exige `SET LOCAL` e queries na mesma transação.
- Octane, Horizon e workers persistentes limpam contexto e fazem purge/reconnect ou reset equivalente após cada unidade de trabalho.
- Listener de término atua como defesa adicional; falha de reset deve invalidar a conexão.

## 6. Autorização interna

Schema separa clientes; RBAC separa congregações. Pastor presidente e funções gerais podem ter `all_congregacoes`. Secretário, tesoureiro e dirigente local recebem congregações explícitas. Policies validam capacidade e congregação; Request não define escopo.

## 7. Global e Tenant Migrations

Global Migrations executam uma vez no landlord. Tenant Migrations executam no provisioning e em todos os Tenants a cada release.

A escolha é controle central em `landlord.tenant_migrations`, com Tenant, nome, checksum, batch, status, tentativas, início/fim e erro. Isso permite identificar schemas atrasados mesmo indisponíveis. Requisitos:

- lock por Tenant;
- idempotência e retry;
- contexto individual configurado/limpo;
- canary e lotes;
- compatibilidade de versões adjacentes;
- expansão/contração para mudanças destrutivas;
- alerta e bloqueio seletivo de feature em Tenant atrasado.

## 8. Tenant Provisioning

```text
1. Criar conta global
2. Criar Tenant em provisioning
3. Gerar schema_name pelo ID
4. CREATE SCHEMA seguro
5. Executar Tenant Migrations
6. Semear catálogos e criar Matriz
7. Criar perfil/vínculo do pastor presidente
8. Associar trial/plano
9. Executar smoke checks
10. Marcar trial/active
```

Efeitos externos exigem saga: etapas registradas, retry idempotente e compensação. Schema parcial só pode ser removido enquanto `provisioning` for confirmado; caso contrário, marcar `provisioning_failed` para intervenção.

## 9. Jobs, comandos e scheduler

Job carrega `tenant_id`, nunca schema. Middleware de queue localiza Tenant, valida status, inicializa, executa e limpa em `finally`. Comandos exigem `--tenant` ou `--all-tenants` explicitamente. Scheduler lista Tenants no landlord e despacha um job por Tenant, sem manter contexto no loop.

## 10. Cache, storage, logs e relatórios

- Cache: `tenant:{id}:...`; nunca chaves genéricas para dado do cliente.
- Storage: `tenants/{id-padded}/...`; caminho construído pelo serviço.
- Download privado: policy ou URL assinada vinculada ao Tenant.
- Logs: request ID, Tenant ID, usuário, congregação, sem segredos.
- Auditoria SaaS no landlord; operacional no Tenant Schema com correlação.
- Relatório normal consulta um Tenant; relatório Present Tech cross-tenant exige permissão específica e dados agregados/anonimizados.

## 11. Backup e recuperação

- backup completo/contínuo conforme RPO/RTO;
- export individual com `pg_dump --schema=<schema confiável>`;
- restauração primeiro em schema temporário, validação e troca controlada;
- objetos com prefixo por Tenant, versionamento e retenção;
- testes periódicos de restauração completa e individual;
- criptografia e privilégio mínimo.

Exclusão acidental nunca é restaurada diretamente sobre o destino antes da validação.

## 12. Cancelamento e exclusão

Estados incluem `trial`, `active`, `past_due`, `suspended`, `cancelled`, `pending_deletion`, `deleted` e provisioning. Cancelamento não executa `DROP SCHEMA`. Durante retenção, preservar/exportar conforme contrato. Exclusão definitiva exige prazo, backup/export, job privilegiado, alvo resolvido no landlord, proteção de schemas reservados, auditoria e aprovação.

## 13. Platform admin e suporte

`platform_admin` administra SaaS, mas não lê automaticamente dados de clientes. Suporte exige `support_access_grant` explícito, justificativa, Tenant, capacidades, concessor, expiração e auditoria. A sessão mostra que está em modo suporte e encerra ao expirar.

## 14. Segurança e testes

Controles: schema somente do landlord, formato allowlist, quoting seguro, vínculo/status validados, reset em sucesso/falha/timeout, cache/storage isolados e alertas para contexto divergente.

Testes obrigatórios:

1. IDs locais iguais em schemas A/B não se misturam.
2. Adulteração de slug, Tenant ID, schema e congregação falha.
3. Usuário N:N troca somente entre vínculos válidos.
4. Request após exception não herda contexto.
5. Jobs, scheduler, comandos, cache, export e arquivos ficam isolados.
6. Tenant suspenso não inicializa.
7. Migration falha em A sem contaminar B.
8. Suporte funciona somente durante concessão válida.
9. Restore individual não altera outros schemas.

## 15. Evolução e alternativas

O domínio depende de `TenantContext`, não de `schema_name`. O connection manager resolve localização `schema` e futuramente `database`.

- **Escolha atual:** schema por Tenant; equilibra isolamento e operação.
- **Rejeitada agora:** tabelas compartilhadas com `tenant_id`; risco de filtro ausente.
- **Evolução:** banco dedicado para clientes maiores; custo operacional superior.
- **Riscos aceitos:** migrations, provisioning, pooling e muitos schemas; mitigados por centralização, lotes, compensação, reset, testes e observabilidade.


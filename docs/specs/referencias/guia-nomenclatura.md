# Guia obrigatório de nomenclatura

## 1. Regra geral e prioridade

1. Contrato obrigatório de framework/biblioteca.
2. Convenção oficial Laravel.
3. Compatibilidade de API publicada.
4. Domínio Pastoral360 em português.
5. Preferência estética.

Laravel mantém `created_at`, `updated_at`, `deleted_at`, `remember_token`, `password`, `email`, `id`, `uuid`, `users`, `jobs`, `migrations`, namespaces/pastas e métodos `up`, `down`, `handle`, `authorize`, `rules`, `index`, `store`, `update` e `destroy`.

## 2. Domínio

- Tabelas: `snake_case`, plural, português e sem acentos.
- Campos/FKs: português sem abreviações; `congregacao_id`, `membro_id`, `data_nascimento`.
- Models: singular em português; `Congregacao`, `Membro`, `LancamentoFinanceiro`.
- Controllers: domínio em português, sufixo técnico; `MembroController`.
- Services: ação/domínio em português; `CadastroMembroService`.
- Jobs: ação em português, sufixo técnico; `SincronizacaoPagamentoJob`.
- Métodos de negócio: português; `calcularSaldo()`, `podeAcessarCongregacao()`.
- Variáveis: `$membro`, `$tenantAtual`, `$valorTotal`.
- Enums: conceito/cases em português; valores externos podem permanecer compatíveis e devem ser documentados.
- URLs internas: `/membros`, `/congregacoes`, `/tesouraria`, `/relatorios`.
- Funções/views/triggers PostgreSQL próprios: português sem acentos.

## 3. Usuários e Tenant

`users` permanece tabela técnica Laravel. Tabelas próprias adotam um padrão único:

- `tenant_usuarios`;
- `perfis_usuario_tenant`;
- `usuario_congregacoes`.

`Tenant`, `tenant_id`, `schema_name`, `tenant_migrations` e schemas `tenant_NNNNNN` permanecem por serem convenções arquiteturais consolidadas. Interface mostra Igreja, Ministério ou Organização, nunca Tenant.

## 4. Migrations

Nome técnico preserva verbos Laravel e tabela em português:

```text
2026_08_30_120000_create_membros_table.php
2026_08_30_120100_create_congregacoes_table.php
2026_08_30_120200_create_lancamentos_financeiros_table.php
```

Global Migrations e Tenant Migrations seguem a mesma política.

## 5. Obrigação para specs e planos

Cada entidade nova deve declarar: nome funcional, Model, tabela, campos principais e relacionamentos. Todo plano já nomeia tabela, coluna, Model, Controller, Service, Job, Policy, Enum, Repository, função, trigger, view e endpoint. Não postergar a nomenclatura para implementação.

Toda spec nova usa [glossário](glossario.md) e [template](template-spec.md). Sinônimo novo exige atualização justificada do glossário.

## 6. Compatibilidade e legado

Não renomear objeto implementado automaticamente. Classificar a mudança e criar migration/refatoração compatível.

| Objeto atual | Padrão novo | Classificação |
|---|---|---|
| Model `Person` / tabela `pessoas` | `Membro` / `membros` | Migração e refatoração; potencial breaking change |
| Model `Child` / tabela `criancas` | `Crianca` / `criancas` | Refatoração de código |
| `ChurchSetting` | `ConfiguracaoIgreja` | Refatoração de código |
| `FinancialMovement` / movimentos atuais | `LancamentoFinanceiro` / `lancamentos_financeiros` | Migração e refatoração |
| `CarouselImage` | `ImagemCarrossel` | Refatoração de código |
| `PastorMessage` | `MensagemPastoral` | Refatoração de código |
| `EventRegistration` | `InscricaoEvento` | Refatoração de código |
| campos legados em inglês ainda existentes | equivalentes do glossário | Migration necessária |
| rotas/API já publicadas em inglês | preservar ou versionar | Breaking change se alteradas diretamente |

O novo projeto deve nascer no padrão. O sistema legado é migrado por etapas, com aliases/adaptadores temporários quando necessário, testes e plano de rollback.


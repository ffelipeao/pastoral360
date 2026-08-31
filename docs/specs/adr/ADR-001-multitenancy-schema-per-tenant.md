# ADR-001 — Schema PostgreSQL dedicado por Tenant

- Status: aceito
- Data: 2026-08-30
- Produto: Pastoral360

## Contexto

O Pastoral360 hospeda dados administrativos, pessoais e financeiros de igrejas distintas. Tabelas compartilhadas com `tenant_id` deixariam a separação dependente de filtros corretos. Tenant é o ministério contratante; congregações pertencem a ele.

## Decisão

Usar `landlord` para dados SaaS e um schema `tenant_NNNNNN` por Tenant. Centralizar resolução, contexto e conexão no Laravel. Separar Global Migrations de Tenant Migrations. O domínio não conhece o schema físico, preparando banco dedicado futuro.

## Consequências positivas

- isolamento estrutural e menor risco de filtro ausente;
- export/restauração individual;
- IDs e unicidades locais;
- caminho para banco dedicado.

## Consequências negativas

- migrations e deploy mais complexos;
- provisioning/compensação obrigatórios;
- muitos schemas;
- cuidado rigoroso com pooling e `search_path`;
- relatório global exige pipeline explícito.

## Alternativas

- Tabelas compartilhadas: mais simples, rejeitadas pelo isolamento lógico.
- Banco dedicado: isolamento superior, reservado para evolução pelo custo operacional.

## Riscos e controles

- conexão residual: reset em `finally`, `SET LOCAL` e testes com pool;
- injeção em schema: landlord, formato fechado e quoting;
- schema atrasado: controle central, lotes e retry;
- provisioning parcial: estados e compensação;
- suporte abusivo: concessão temporária auditada;
- exclusão indevida: retenção, backup e dupla validação.

## Referências

- [Arquitetura multi-tenant](../referencias/architecture/multi-tenancy.md)
- [Tenancy e isolamento](../referencias/02-tenancy-e-isolamento.md)
- [Modelo de dados](../referencias/05-modelo-de-dados.md)

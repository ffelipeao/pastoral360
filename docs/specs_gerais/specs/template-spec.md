# Template obrigatório para novas specs

> Toda nova spec deve seguir o glossário e a convenção de nomenclatura do Pastoral360. Domínio, tabelas, campos, Models, funções e serviços próprios usam português. Elementos exigidos ou convencionais do Laravel e bibliotecas mantêm o nome original.

## Contexto e objetivo

Descrever problema, Tenant Context e congregações envolvidas.

## Entidades

Para cada entidade:

```text
Nome funcional:
Model:
Tabela:

Campos principais:
- id
- ...
- created_at
- updated_at

Relacionamentos:
- ...
```

## Autorização e isolamento

- Tenant Schema consultado.
- Permissões necessárias.
- Escopo de congregações.
- Comportamento para recurso fora do contexto.
- Jobs, Cache, Storage e auditoria envolvidos.

## Aplicação

Declarar previamente:

```text
Model:
Controller:
Service:
Job:
Policy:
Enum:
Repository/DTO, se necessário:
Rotas/endpoints:
```

Métodos REST seguem Laravel. Métodos de negócio usam português.

## Banco e migrations

- Classificar Global Migration ou Tenant Migration.
- Informar tabela, campos, FKs, índices e constraints.
- Nomear arquivo como `create_<tabela_em_portugues>_table.php` ou equivalente Laravel.
- Informar compatibilidade, backfill, rollback e impacto em schemas existentes.

## Requisitos e critérios de aceite

Incluir casos positivos, permissão negada, outra congregação, outro Tenant, adulteração de IDs/schema, filas/cache/storage e auditoria quando aplicável.

## Compatibilidade

Classificar cada mudança como: somente spec, novo código, refatoração segura, migration necessária ou breaking change.

## Glossário

Listar termos novos. Se não estiverem em [glossario.md](glossario.md), atualizar o glossário na mesma alteração.

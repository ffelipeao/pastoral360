# Especificações executáveis

| ID | Especificação | Perfil | Estado |
|---|---|---|---|
| SPEC-001 | [Site institucional da Pastoral 360](001-site-institucional/spec.md) | `static` | Planejada |
| SPEC-002 | [Plataforma SaaS multi-tenant](002-plataforma-multitenant/spec.md) | `laravel` | Planejada |

Cada pasta contém uma `spec.md` executável pelo orquestrador e pode conter um `reference.md` com contexto detalhado.

## Convenção de execução

Toda `spec.md` deve terminar com a seção `## Executar com o orquestrador` e um comando copiável no seguinte formato:

```bash
python3 automation/orchestrator.py docs/specs_geral/00N-slug/
```

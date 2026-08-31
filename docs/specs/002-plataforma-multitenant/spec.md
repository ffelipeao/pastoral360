# SPEC-002 — Plataforma SaaS multi-tenant da Pastoral360

## Contexto

Construir a aplicação de gestão da Pastoral360 em Laravel, servida em `/gestao`, mantendo o site institucional estático da raiz independente. Cada organização contratante é um Tenant isolado em schema PostgreSQL próprio; sede e filiais são congregações internas desse Tenant.

Antes de implementar qualquer etapa, ler os documentos em `../referencias/`, o detalhamento de multi-tenancy em `../referencias/architecture/multi-tenancy.md` e a decisão em `../adr/ADR-001-multitenancy-schema-per-tenant.md`. Em caso de divergência, a ADR e as regras de isolamento têm precedência.

## Restrições globais

- Criar a aplicação Laravel no diretório `gestao/`; não substituir nem acoplar o site estático da raiz ao banco da gestão.
- Usar PostgreSQL com schema central `landlord` e schemas no formato `tenant_000001`.
- Resolver nomes físicos de schema somente a partir do landlord; nunca confiar em schema, Tenant ou congregação enviados pelo cliente.
- Usar português nos elementos de domínio e manter em inglês apenas convenções do Laravel e de bibliotecas.
- Toda operação tenant-aware deve inicializar e limpar o contexto, inclusive em falha, filas, comandos e processos reutilizados.
- Não migrar dados reais nem executar ações destrutivas sem autorização explícita.
- Implementar somente a etapa solicitada pelo orquestrador e preservar os contratos definidos nas etapas anteriores.

## Etapa 1 — Fundação Laravel e isolamento multi-tenant

### Referências obrigatórias

- `../referencias/01-visao-e-arquitetura.md`
- `../referencias/02-tenancy-e-isolamento.md`
- `../referencias/05-modelo-de-dados.md`
- `../referencias/06-rotas-e-implantacao.md`
- `../referencias/architecture/multi-tenancy.md`

### Requisitos

- Confirmar e documentar os pré-requisitos de PHP, PostgreSQL, rewrites/proxy, fila e armazenamento.
- Criar a base Laravel em `gestao/`, com configuração compatível com a publicação sob `/gestao` e sem alterar a entrega estática de `/`.
- Implementar landlord, cadastro de Tenants, `TenantContext`, resolvedor, gerenciador de conexão e ciclo seguro de inicialização/reset.
- Separar Global Migrations e Tenant Migrations, com controle central de versão, checksum, lote, tentativas e resultado.
- Implementar provisioning idempotente com nomes de schema gerados pelo servidor, allowlist e quoting seguro.
- Criar testes com dois schemas, IDs locais coincidentes, troca de contexto e limpeza após sucesso e exceção.

### Critérios de aceite

- `/` continua independente da aplicação e `/gestao` inicializa o Laravel.
- Uma requisição sem Tenant não consulta tabelas tenant-aware.
- O contexto nunca aceita `schema_name` fornecido pelo cliente.
- Uma conexão reutilizada não preserva `search_path` do Tenant anterior.
- Falha de provisioning é registrada sem deixar Tenant parcialmente ativo.
- A suíte de isolamento e o formatador passam.

## Etapa 2 — Identidade, onboarding e administração

### Referências obrigatórias

- `../referencias/03-identidade-e-permissoes.md`
- RF-02 a RF-05 de `../referencias/04-requisitos-funcionais.md`
- seções landlord, congregações e autorização de `../referencias/05-modelo-de-dados.md`

### Requisitos

- Implementar autenticação, vínculos N:N entre usuários e Tenants, seleção segura de contexto e revalidação de status.
- Implementar onboarding transacional/compensável de organização, schema, sede, configuração e primeiro vínculo.
- Implementar congregações, usuários, convites, papéis, capacidades e escopo por unidade.
- Impedir elevação de privilégio e acesso implícito de admin da plataforma aos dados internos.
- Entregar dashboard escopado ao Tenant e às congregações autorizadas.
- Auditar alterações sensíveis e criar testes positivos, negativos e de adulteração de IDs.

### Critérios de aceite

- Uma organização nasce com exatamente uma sede e pode receber filiais posteriormente.
- Usuário com um vínculo entra direto; usuário N:N escolhe somente entre Tenants autorizados.
- Troca de Tenant ou congregação por URL/payload não amplia acesso.
- Convites são de uso único, expiram e não concedem capacidades superiores às do emissor.
- Papéis e dashboard respeitam simultaneamente capacidades e unidades.

## Etapa 3 — Secretaria e ciclos de pessoas

### Referências obrigatórias

- RF-06 a RF-09 de `../referencias/04-requisitos-funcionais.md`
- entidades correspondentes em `../referencias/05-modelo-de-dados.md`
- fluxos de batismo e isolamento em `../referencias/07-qualidade-e-aceite.md`

### Requisitos

- Implementar pessoas/membros, visitantes, crianças, candidatos e registros de batismo.
- Aplicar busca, paginação, filtros, inativação e unicidades no Tenant Schema quando cabível.
- Validar relacionamentos aninhados para que pessoa, congregação e registros pertençam ao mesmo Tenant e escopo permitido.
- Tornar a conversão de candidato em membro e registro de batismo idempotente e transacional.
- Registrar origem, consentimentos e auditoria conforme os dados tratados.
- Cobrir policies, route binding, payload adulterado e IDs coincidentes em Tenants diferentes.

### Critérios de aceite

- Listagens, contadores e buscas não vazam registros entre congregações ou Tenants.
- Repetir uma conversão de batismo não duplica membro nem registro.
- Usuário sem capacidade não acessa dados por HTML, JSON, exportação ou relacionamento indireto.
- Dados pessoais não são copiados integralmente para logs ou auditoria.

## Etapa 4 — Tesouraria

### Referências obrigatórias

- RF-10 de `../referencias/04-requisitos-funcionais.md`
- seção de tesouraria de `../referencias/05-modelo-de-dados.md`
- critérios financeiros de `../referencias/07-qualidade-e-aceite.md`

### Requisitos

- Implementar categorias e movimentos financeiros de entrada e saída com valores decimais.
- Escopar consultas, filtros, saldos e relatórios ao Tenant e às congregações autorizadas.
- Implementar cancelamento auditável sem apagar histórico.
- Proteger valores financeiros de usuários sem capacidade, inclusive em respostas JSON e agregações.
- Validar concorrência, integridade, relacionamentos e adulteração de escopo.

### Critérios de aceite

- O saldo corresponde às entradas menos saídas ativas do escopo selecionado.
- Cancelar um movimento preserva histórico, autoria e recalcula agregados.
- IDs locais coincidentes e filtros manipulados não atravessam schemas.
- Testes financeiros e de autorização passam com pelo menos dois Tenants.

## Etapa 5 — Cultos, eventos e site público do Tenant

### Referências obrigatórias

- RF-11 a RF-15 de `../referencias/04-requisitos-funcionais.md`
- `../referencias/06-rotas-e-implantacao.md`
- critérios de evento de `../referencias/07-qualidade-e-aceite.md`

### Requisitos

- Implementar cultos, eventos, inscrições, configuração do site, carrossel e mensagens.
- Resolver `/site/{slug}` no landlord, validar status/publicação e só então inicializar o Tenant Schema.
- Separar rascunho, preview autenticado e conteúdo publicado.
- Impedir inscrições após prazo ou lotação e tratar concorrência sem ultrapassar limite.
- Isolar cache e storage por Tenant; arquivos privados exigem entrega autorizada.
- Gerar URLs corretas sob `/gestao` e `/site/{slug}` nos ambientes suportados.

### Critérios de aceite

- Um slug nunca apresenta conteúdo ou cache de outro Tenant.
- Conteúdo em rascunho não aparece no site público.
- Duas inscrições simultâneas não excedem a capacidade do evento.
- Upload, download, filas e cache respeitam o contexto e o limpam ao final.
- O site institucional em `/` permanece funcional sem conexão com o landlord.

## Etapa 6 — Migração, operação e gate de liberação

### Referências obrigatórias

- `../referencias/07-qualidade-e-aceite.md`
- `../referencias/08-migracao-e-entrega.md`
- `../referencias/architecture/multi-tenancy.md`

### Requisitos

- Implementar importador idempotente com `tenant_id` explícito, mapa de IDs, lotes, métricas e relatório de ambiguidades.
- Não inferir silenciosamente unidade para registros legados sem correspondência confirmada.
- Implementar comandos e jobs de Tenant Migrations com alvo explícito, lotes, retry e limpeza em `finally`.
- Documentar backup, restauração, rollback, retenção, cancelamento e exclusão definitiva com dupla validação.
- Executar a matriz completa de segurança, isolamento, autorização, responsividade e fluxos críticos.
- Documentar implantação, filas, scheduler, monitoramento e procedimentos operacionais.

### Critérios de aceite

- Totais por tabela, unidade e movimentos financeiros são reconciliados antes do corte.
- Falha em um Tenant não contamina o contexto nem impede o relatório dos demais.
- Backup e rollback são ensaiados antes da liberação.
- Todos os gates de `../referencias/08-migracao-e-entrega.md` estão atendidos ou registrados como bloqueio explícito.
- Testes, análise de estilo e auditorias disponíveis passam sem pendências críticas.

## Executar com o orquestrador

Na raiz do projeto, liste as etapas antes de iniciar:

```bash
python3 automation/orchestrator.py docs/specs/002-plataforma-multitenant/ --list-steps
```

Execute a spec completa ou limite o intervalo com `--from-step` e `--to-step`:

```bash
python3 automation/orchestrator.py docs/specs/002-plataforma-multitenant/
```

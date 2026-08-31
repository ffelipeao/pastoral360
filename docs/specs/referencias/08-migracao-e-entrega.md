# 8. Migração e plano de entrega

## 8.1 Estratégia

O novo sistema deve nascer em projeto/repositório separado. O sistema atual permanece disponível como fonte de comportamento e dados até a homologação. Não se recomenda remover módulos do projeto atual antes do corte.

## 8.2 Fases

### Fase 0 — Descoberta e prova de infraestrutura

- confirmar servidor, banco, rewrites/proxy e armazenamento;
- provar `/`, `/gestao` e `/site/demo`;
- confirmar que a base legada vira um Tenant e `igrejas` vira suas congregações;
- congelar o dicionário de dados e regras de migração.

### Fase 1 — Fundação

- criar projeto Laravel;
- implementar landlord, Tenant Resolver/Manager/Context, conexão, migrations e autorização;
- autenticação, convites, papéis e auditoria;
- suíte de isolamento com dois Tenant Schemas e conexão reutilizada.

### Fase 2 — Onboarding e administração

- cadastro da organização e sede;
- filiais;
- usuários e vínculos;
- dashboard escopado.

### Fase 3 — Secretaria

- membros/pessoas;
- visitantes;
- crianças;
- candidatos e registros de batismo;
- importação e consentimentos.

### Fase 4 — Tesouraria

- categorias;
- entradas, saídas, saldo, filtros e cancelamento;
- controles e testes financeiros.

### Fase 5 — Site e eventos

- configurações, carrossel e mensagens;
- cultos, eventos e inscrições;
- `/site/{slug}`, preview e publicação.

### Fase 6 — Migração e corte

- provisionar Tenant destino e ensaiar importação dentro de seu schema;
- reconciliação de totais por tabela e unidade;
- homologação por perfis reais;
- janela de congelamento ou sincronização final;
- backup, migração final, smoke tests e liberação;
- rollback documentado.

## 8.3 Regras de conversão do sistema atual

Para a base atual, criar um Tenant no landlord e seu Tenant Schema. `is_sede` vira congregação matriz; os demais registros viram filiais.

- configuração singleton -> configuração dessa organização;
- carrossel e mensagens globais -> conteúdo da organização;
- cultos com igreja nula -> unidade sede;
- eventos com igreja nula -> evento de escopo organizacional, após validação;
- pessoas, visitantes, crianças, batismos e movimentos com igreja nula -> exigem regra explícita; preferencialmente unidade sede somente quando confirmado pelo responsável;
- administradores atuais -> mapear conscientemente para admin da plataforma ou pastor presidente; nunca promover automaticamente todos;
- perfis existentes -> converter para capacidades e vínculos de unidade.

Registros ambíguos devem ir para relatório de pendências, não ser silenciosamente associados.

## 8.4 Importador

O importador DEVE ser idempotente, aceitar `tenant_id` explícito, resolver o schema pelo landlord, registrar lote/origem e manter mapa de IDs.

- lidos, inseridos, atualizados, ignorados e rejeitados;
- chaves sem correspondência;
- registros sem unidade;
- duplicidades;
- totais financeiros antes/depois;
- hashes ou checksums quando úteis.

## 8.5 Cancelamento, retenção e exclusão

Cancelamento marca `cancelled`; nunca executa `DROP SCHEMA`. Após retenção e export, passa a `pending_deletion`. Exclusão definitiva exige job privilegiado, dupla validação do alvo, backup, auditoria e aprovação. Depois do drop, manter metadados mínimos e estado `deleted`.

## 8.6 Tenant Migrations em produção

- provisioning executa todas antes da ativação;
- releases rodam Global Migrations uma vez e Tenant Migrations em lotes;
- falha em um Tenant não herda contexto nem bloqueia o relatório dos demais;
- `landlord.tenant_migrations` registra versão, checksum, batch e resultado;
- mudanças destrutivas usam expansão/contração e backup.

## 8.7 Gate de liberação

O corte só pode ocorrer quando:

- todos os testes de isolamento passam;
- a matriz de papéis é homologada;
- totais migrados são reconciliados;
- sites públicos não expõem rascunhos;
- backup e rollback foram ensaiados;
- o site raiz segue independente;
- logs, monitoramento, fila e scheduler estão operacionais;
- não existem pendências críticas de migração.

## 8.8 Riscos conhecidos

| Risco | Mitigação |
|---|---|
| uso atual de configuração global | introduzir organização antes de migrar conteúdo |
| contexto incorreto de schema | Tenant Manager, reset em `finally` e testes com pooling |
| significado ambíguo de `igreja` | separar organização de unidade no novo domínio |
| registros legados sem igreja | relatório e decisão humana; não inferir silenciosamente |
| permissões baseadas em nomes/IDs legados | capacidades estáveis e vínculos explícitos |
| migrations em muitos schemas | controle central, lotes e retry |
| hospedagem sem PostgreSQL/schema ou rewrites | prova na Fase 0 |
| arquivos públicos previsíveis | paths tenant-aware e entrega autorizada quando privada |

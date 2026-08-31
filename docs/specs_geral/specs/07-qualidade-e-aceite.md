# 7. Qualidade, segurança e critérios de aceite

## 7.1 Estratégia de testes

Devem existir testes unitários, de feature e de integração. Os testes de feature devem usar pelo menos:

- dois Tenants com schemas diferentes;
- sede e duas filiais na organização A;
- sede na organização B;
- usuários em cada papel;
- registros com IDs conhecidos em cada escopo.

## 7.2 Matriz mínima de isolamento

Para cada recurso tenant-aware, testar `index`, `show/edit`, `store`, `update` e `destroy` quando existirem:

1. acesso permitido na unidade atribuída;
2. acesso negado em outra congregação do mesmo Tenant;
3. mesmo ID local em outro Tenant Schema não é retornado;
4. ID estrangeiro adulterado no payload;
5. route binding com ID estrangeiro;
6. listagens, buscas, paginação e contadores sem vazamento;
7. relacionamentos aninhados incompatíveis;
8. arquivo fora do escopo;
9. platform admin sem acesso implícito e suporte auditado;
10. pastor presidente agregando apenas seu Tenant;
11. `search_path` limpo após sucesso, erro e troca;
12. job, cache, relatório e storage isolados.

## 7.3 Critérios de aceite gerais

- `/` continua disponível como site estático sem inicializar Laravel.
- Um Tenant pode concluir provisioning com matriz e sem filiais.
- Uma organização pode adicionar filiais depois do onboarding.
- O site publicado responde em `/site/{slug}` e nunca mistura conteúdo de outro slug.
- Toda tela mostra organização e unidade/filtro ativos.
- Trocar IDs na URL ou formulário não concede acesso.
- Pastor presidente acessa sede e todas as filiais somente da própria organização.
- Dirigente acessa somente filiais atribuídas.
- Secretário acessa somente secretaria nas unidades atribuídas.
- Tesoureiro acessa somente tesouraria nas unidades atribuídas.
- Papel personalizado respeita interseção entre capacidades e unidades.
- Platform admin gerencia metadados dos Tenants, mas acessa conteúdo somente com concessão explícita.
- Alterações sensíveis ficam registradas em auditoria.

## 7.4 Critérios por fluxo crítico

### Cadastro inicial

- Cria Tenant, schema, migrations, matriz, configuração e vínculo com transação/compensações.
- Não apaga nem altera dados preexistentes de outra organização.
- Falha em qualquer etapa desfaz toda a operação.

### Batismo

- Conversão cria no máximo um membro e um registro de batismo.
- Repetir a requisição não duplica registros.
- Todos os registros pertencem à mesma organização e unidade.

### Evento

- Prazo e lotação impedem novas inscrições.
- Duas inscrições simultâneas não ultrapassam o limite.
- Pessoa de outra organização não pode ser associada.

### Tesouraria

- Saldo corresponde às entradas menos saídas ativas do escopo.
- Cancelamento preserva histórico e recalcula saldo.
- Usuário sem capacidade não vê valores nem em resposta HTML/JSON.

## 7.5 Segurança

- OWASP Top 10 considerado no review.
- Senhas com hasher padrão seguro do framework.
- Rate limiting e proteção CSRF.
- Validação de MIME, tamanho e extensão de uploads.
- SVG e HTML enviados por usuário devem ser bloqueados ou sanitizados.
- Conteúdo textual deve ser escapado por padrão.
- Mass assignment não pode aceitar campos de tenant ou privilégio.
- Queries raw devem ser parametrizadas.
- Secrets nunca entram no repositório ou logs.
- Dependências passam por auditoria automatizada.
- `schema_name`, `tenant_id` e `congregacao_id` adulterados não mudam contexto.

## 7.6 Testes multi-tenant obrigatórios

1. Membros com mesmo ID nos schemas A/B permanecem isolados.
2. URL do Tenant A não retorna registro de B.
3. Job de A não lê/altera B e limpa contexto.
4. Cache mantém valores distintos por Tenant.
5. Export contém somente o Tenant ativo.
6. Upload/download não atravessa prefixos.
7. Usuário N:N alterna apenas entre Tenants autorizados.
8. Manipulação de Tenant ID, schema ou congregação falha.
9. Exception não deixa `search_path` residual.
10. Tenant suspenso não inicializa contexto.

## 7.7 LGPD

- Registrar base/consentimento quando aplicável e versão do termo.
- Minimizar dados coletados e limitar retenção.
- Definir exportação e anonimização por solicitação.
- Logs e auditoria não devem copiar documentos ou dados sensíveis completos.
- Backups devem seguir retenção e controle de acesso.

## 7.8 Definição de pronto

Uma história só está pronta quando possui implementação, policy, validação escopada, migrations/índices, testes positivos e negativos, auditoria quando aplicável, documentação da rota e revisão visual responsiva.

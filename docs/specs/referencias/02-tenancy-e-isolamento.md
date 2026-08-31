# 2. Tenancy, schemas, hierarquia e isolamento

## 2.1 Hierarquia

```text
Pastoral360
  ├─ landlord.tenants
  ├─ tenant_000001
  │    ├─ Matriz
  │    └─ Congregação A
  └─ tenant_000002
       └─ Matriz
```

Um Tenant é o contratante inteiro e possui exatamente uma congregação `tipo = matriz`. Congregações não podem ser transferidas entre Tenant Schemas.

## 2.2 Contexto autenticado

Após o login, o sistema calcula um `AccessContext` imutável contendo:

- usuário autenticado;
- Tenant ativo, resolvido pelo landlord;
- congregações autorizadas;
- papel e capacidades válidas para cada vínculo;
- indicação de administrador da plataforma.

Usuários com um Tenant entram diretamente; usuários N:N selecionam o Tenant. Sessão, vínculo e status são revalidados no landlord. Platform admin não recebe acesso automático ao conteúdo dos Tenants.

O seletor de unidade pode conter:

- uma unidade específica;
- “todas as unidades permitidas”, somente quando o papel autorizar agregação.

## 2.3 Regras obrigatórias de isolamento

- Toda tabela eclesiástica existe exclusivamente no Tenant Schema ativo.
- Tabelas internas não precisam repetir `tenant_id`; o schema é a fronteira estrutural.
- Registros locais possuem `congregacao_id`; o ID recebido deve existir no schema ativo e estar autorizado.
- Leitura, mutação, exports e relações aplicam Tenant Context, congregação e capacidade.
- Relacionamentos aninhados DEVEM validar a mesma organização. Exemplo: uma inscrição deve pertencer ao evento informado, e ambos à organização ativa.
- Um recurso fora do escopo DEVE responder `404`, evitando revelar sua existência. Falta de capacidade dentro de um recurso visível pode responder `403`.
- Jobs, comandos e scheduler recebem `tenant_id` explícito.
- Cache usa `tenant:{id}` e storage usa `tenants/{id}/...`.

## 2.4 Estratégia Laravel

A implementação DEVE combinar:

1. TenantResolver, TenantManager, TenantContext e middleware;
2. TenantConnectionManager que seleciona o schema;
3. policies por recurso;
4. Form Requests com autorização e validações escopadas;
5. route binding escopado;
6. constraints no banco;
7. testes negativos de isolamento.

O schema correto, não um global scope, é o isolamento primário. Suporte da plataforma exige concessão explícita, justificada, temporária e auditada.

## 2.5 Ciclo seguro do contexto

```text
Authenticate → ResolveTenant → ValidateTenantAccess
→ InitializeTenantSchema → Request → ClearTenantContext (finally)
```

`schema_name` vem somente de `landlord.tenants`, passa por formato fechado e quoting seguro. Em transações, preferir `SET LOCAL search_path`. Fora delas, resetar em `finally`. Pooling e workers persistentes nunca podem reaproveitar o contexto anterior.

## 2.6 Escopo público

`/site/{slug}` resolve o Tenant no landlord, valida status/publicação e inicializa seu schema antes de consultar conteúdo.

Um slug inexistente, suspenso ou não publicado retorna `404`. Preview administrativo usa rota autenticada separada e não torna o site público.

## 2.7 Casos que obrigatoriamente falham

- dirigente da filial A altera a URL para o ID da filial B;
- secretário envia `unidade_id` de uma unidade não vinculada;
- tesoureiro acessa membro diretamente pela URL;
- usuário do Tenant A tenta ativar B ou enviar seu `schema_name`;
- inscrição de evento A é atualizada usando a rota do evento B;
- busca, contador ou dashboard inclui registros de unidade não autorizada;
- arquivo de outra organização é acessado por caminho previsível;
- job executa sem Tenant ID ou deixa contexto residual.

Detalhes: [Arquitetura multi-tenant](architecture/multi-tenancy.md).

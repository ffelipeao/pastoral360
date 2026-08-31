# 3. Identidade, papéis e permissões

## 3.1 Modelo de autorização

A autorização usa RBAC com escopo:

```text
usuário global + Tenant ativo + congregações + papel + capacidades
```

`landlord.tenant_users` autoriza entrada no Tenant; RBAC no Tenant Schema define capacidades e congregações. Um usuário pode pertencer a vários Tenants.

## 3.2 Papéis iniciais

| Papel | Escopo padrão | Capacidades padrão |
|---|---|---|
| Administrador da plataforma | Landlord | Gestão SaaS; sem acesso automático ao conteúdo do Tenant |
| Pastor presidente | Uma organização inteira | Todos os módulos da sede e filiais |
| Dirigente de congregação | Unidades explicitamente atribuídas | Gestão administrativa da unidade, exceto permissões reservadas |
| Secretário(a) | Unidades explicitamente atribuídas | Secretaria: pessoas, membros, visitantes, crianças e batismos |
| Tesoureiro(a) | Unidades explicitamente atribuídas | Tesouraria da unidade |
| Gestor do site | Organização ou unidades atribuídas | Conteúdo público, cultos, eventos e inscrições |
| Papel personalizado | Unidades explicitamente atribuídas | Capacidades selecionadas por usuário autorizado |

“Administrador da plataforma” é global e separado dos papéis eclesiásticos. Suporte exige concessão explícita, justificativa, expiração e auditoria.

## 3.3 Matriz mínima de capacidades

| Capacidade | Admin plataforma | Pastor presidente | Dirigente | Secretário | Tesoureiro | Gestor site |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| organizações gerenciar | ✓ | — | — | — | — | — |
| unidades visualizar | ✓ | todas | atribuídas | atribuídas | atribuídas | atribuídas |
| unidades gerenciar | ✓ | ✓ | unidade própria, se concedido | — | — | — |
| usuários e acessos gerenciar | ✓ | organização | se concedido, sem elevar privilégio | — | — | — |
| secretaria gerenciar | suporte concedido | ✓ | se concedido | ✓ | — | — |
| tesouraria gerenciar | suporte concedido | ✓ | se concedido | — | ✓ | — |
| conteúdo do site gerenciar | ✓ | ✓ | se concedido | — | — | ✓ |
| inscrições de eventos gerenciar | ✓ | ✓ | se concedido | se concedido | — | ✓ |
| auditoria visualizar | ✓ | organização | unidade, se concedido | — | — | — |

## 3.4 Capacidades sugeridas

- `tenants.view`, `tenants.provision`, `tenants.update`, `tenants.suspend` no landlord;
- `units.view`, `units.create`, `units.update`, `units.archive`;
- `users.view`, `users.invite`, `users.update`, `users.revoke`;
- `roles.view`, `roles.manage`;
- `secretariat.view`, `secretariat.manage`;
- `treasury.view`, `treasury.manage`;
- `site.view`, `site.manage`, `site.publish`;
- `events.view`, `events.manage`, `event-registrations.manage`;
- `audit.view`;
- capacidades futuras `ebd.*` e `assets.*`.

Leitura e escrita DEVEM ser capacidades distintas quando isso for configurável.

## 3.5 Antielevação de privilégio

- Um usuário só pode conceder capacidades que possui no mesmo escopo.
- Um dirigente não pode ampliar seu próprio conjunto de unidades.
- Um pastor presidente não pode criar administrador da plataforma.
- O último pastor presidente ativo do Tenant não pode ser removido sem substituto.
- O último administrador ativo da plataforma não pode ser removido.
- Alterações de papel, unidade, suspensão e redefinição de senha DEVEM ser auditadas.

## 3.6 Autenticação

- Login por e-mail e senha.
- Recuperação de senha com token expirável.
- Verificação de e-mail recomendada antes do primeiro acesso.
- Regeneração de sessão no login e invalidação no logout.
- Rate limiting em login e recuperação.
- Cadastro público de usuários desabilitado.
- MFA DEVERIA ser obrigatório para administradores da plataforma e opcional para os demais na primeira versão.

## 3.7 Convites

Usuários são criados por onboarding, convite ou cadastro administrativo. O convite identifica `tenant_id`; após inicialização do schema, o perfil interno define congregações e papel.

## 3.8 Sequência de autenticação

```text
Login landlord → carregar Tenant Users → resolver/selecionar Tenant
→ validar vínculo e status → inicializar schema
→ carregar RBAC/congregações → executar → limpar contexto
```

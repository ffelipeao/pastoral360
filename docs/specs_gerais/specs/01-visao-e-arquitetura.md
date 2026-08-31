# 1. Visão, escopo e arquitetura

## 1.1 Contexto

O sistema atual é uma aplicação Laravel 12/PHP 8.2 que combina site institucional e painel administrativo. Parte do domínio já possui `igreja_id`, porém configurações institucionais, carrossel e mensagens pastorais são globais. `ChurchSetting::current()` também assume uma única organização.

O novo sistema será desenvolvido como produto separado. Este repositório é referência funcional, não modelo de isolamento. O isolamento adotado é schema PostgreSQL por Tenant.

## 1.2 Resultados esperados

- Preservar o site principal em `/`, inicialmente estático.
- Atender vários Tenants sem compartilhar tabelas eclesiásticas.
- Representar uma sede obrigatória e filiais opcionais em cada organização.
- Publicar um site por organização em `/site/{slug}`.
- Oferecer gestão central a administradores da plataforma.
- Delegar acesso por organização, unidade e módulo.
- Manter todas as funcionalidades existentes consideradas no escopo da primeira versão.

## 1.3 Arquitetura lógica

```text
Navegador
  ├─ /                     -> arquivos do site principal estático
  ├─ /site/{slug}          -> aplicação Laravel, área pública do cliente
  └─ /gestao/*             -> aplicação Laravel, área autenticada
                                  |
                                  ├─ Tenant Resolver e Tenant Context
                                  ├─ Tenant Connection Manager
                                  ├─ congregações permitidas
                                  ├─ autorização por capacidade
                                  └─ PostgreSQL: landlord + schema por Tenant
```

A primeira versão DEVE usar schema central `landlord` e schemas `tenant_000001`, `tenant_000002`, etc. Dados internos não dependem de `tenant_id` em cada tabela. A infraestrutura resolve o local físico; o domínio conhece apenas o Tenant atual.

## 1.4 Componentes

- **Site raiz:** HTML/CSS/JS estático, implantado independentemente da aplicação.
- **Aplicação de gestão:** Laravel 12 ou versão estável adotada no início do projeto.
- **Site público das organizações:** views renderizadas pela mesma aplicação de gestão, sem autenticação.
- **Landlord:** Tenants, usuários globais, vínculos, planos, assinaturas, cobrança, flags e provisionamento.
- **Tenant Schemas:** congregações e todos os dados eclesiásticos.
- **Armazenamento:** objetos segregados por organização e unidade.
- **Fila:** processamento de e-mails, imagens e tarefas demoradas.
- **Auditoria:** eventos de segurança e alterações administrativas.

## 1.5 Princípios técnicos

1. O Tenant Context é resolvido e inicializado antes de qualquer consulta tenant-aware.
2. Policies e serviços de domínio são a autoridade final; esconder menus não constitui segurança.
3. Route model binding DEVE ser escopado.
4. IDs ou schemas enviados pelo cliente nunca definem o Tenant ativo.
5. Operações compostas DEVEM usar transação.
6. Exclusão de registros financeiros e de auditoria DEVERIA ser lógica.
7. O site raiz não compartilha sessão, cache de página nem bootstrap com o sistema de gestão.
8. Toda conexão reutilizável configura e restaura o `search_path` em bloco protegido por `finally`.
9. Jobs, comandos e scheduler transportam Tenant ID explicitamente.

## 1.7 Decisão e alternativas

**Escolhida:** schema PostgreSQL por Tenant mais `landlord` central.

**Alternativas:** tabelas compartilhadas com `tenant_id` (rejeitada pelo maior risco de filtro ausente) e banco dedicado (evolução futura).

**Riscos:** migrations em muitos schemas, provisionamento e contexto residual em pool. As mitigações estão em `architecture/multi-tenancy.md`.

## 1.6 Fora de escopo inicial

- cobrança e assinaturas SaaS;
- domínio personalizado por organização;
- aplicativo móvel nativo;
- folha de pagamento ou contabilidade fiscal;
- EBD e patrimônio além da preparação de permissões;
- comunicação em massa por WhatsApp/SMS;
- construtor visual livre de páginas.

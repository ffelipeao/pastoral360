# Especificações do novo ChamaViva

## Objetivo

Estas especificações definem o **Pastoral360** como plataforma SaaS multi-tenant por schema PostgreSQL. Cada igreja ou ministério contratante é um Tenant estruturalmente isolado; matriz e filiais são congregações internas ao Tenant.

O produto terá duas áreas independentes no mesmo domínio:

- `/`: site principal da plataforma, inicialmente estático e sem dependência do banco da gestão;
- `/gestao`: sistema autenticado de gestão;
- `/site/{slug}`: site público gerado para cada organização religiosa.

Neste documento, **organização** significa o cliente independente da plataforma. Uma organização possui exatamente uma sede/matriz e pode possuir zero ou mais filiais/congregações. **Unidade** significa tanto a sede quanto uma filial.

## Documentos

1. [Visão, escopo e arquitetura](01-visao-e-arquitetura.md)
2. [Tenancy, hierarquia e isolamento](02-tenancy-e-isolamento.md)
3. [Identidade, papéis e permissões](03-identidade-e-permissoes.md)
4. [Requisitos funcionais](04-requisitos-funcionais.md)
5. [Modelo de dados](05-modelo-de-dados.md)
6. [Rotas, site público e implantação](06-rotas-e-implantacao.md)
7. [Qualidade, segurança e critérios de aceite](07-qualidade-e-aceite.md)
8. [Migração e plano de entrega](08-migracao-e-entrega.md)
9. [Arquitetura multi-tenant por schema](architecture/multi-tenancy.md)

Decisão registrada em [ADR-001](../adr/ADR-001-multitenancy-schema-per-tenant.md).

## Decisões normativas

As palavras **DEVE**, **NÃO DEVE**, **DEVERIA** e **PODE** são usadas de forma normativa.

- A aplicação DEVE considerar o Tenant como fronteira máxima de isolamento.
- Cada Tenant DEVE possuir Tenant Schema exclusivo, nomeado por identificador interno imutável.
- Dados SaaS globais ficam em `landlord`; dados eclesiásticos ficam no Tenant Schema.
- Dados locais DEVEM possuir `congregacao_id` quando aplicável.
- O acesso NÃO DEVE ser concedido apenas pela presença de um identificador na URL ou formulário.
- Seletores, dashboards, exports, buscas, relacionamentos e validações DEVEM operar no Tenant Context e respeitar congregações autorizadas.
- Request nunca pode fornecer diretamente `schema_name` nem definir o Tenant Context.
- Usuários comuns NÃO DEVEM se cadastrar publicamente. O primeiro administrador é criado pelo onboarding controlado; os demais são convidados ou cadastrados por alguém autorizado.

## Escopo da primeira versão

A primeira versão reproduz as funcionalidades existentes: configuração inicial, organizações e unidades, usuários, membros/pessoas, visitantes, crianças, candidatos e registros de batismo, tesouraria, cultos, eventos e inscrições, carrossel, mensagens pastorais, configurações e site público.

EBD e patrimônio permanecem como permissões preparadas para evolução, pois o projeto atual possui os módulos no modelo de autorização, mas não possui CRUD funcional completo para eles.

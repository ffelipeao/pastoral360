# Glossário oficial do Pastoral360

Este documento é a fonte oficial. Antes de criar entidade ou nome novo, verificar termo equivalente aqui.

| Conceito | Nome funcional | Identificador técnico principal |
|---|---|---|
| Igreja/ministério contratante | Igreja ou Ministério na interface; Tenant na arquitetura | `Tenant`, `tenants` |
| Matriz ou filial do Tenant | Congregação | `Congregacao`, `congregacoes` |
| Pessoa vinculada à igreja | Membro | `Membro`, `membros` |
| Pessoa ainda não vinculada | Visitante | `Visitante`, `visitantes` |
| Criança cadastrada | Criança | `Crianca`, `criancas` |
| Pessoa em preparação para batismo | Candidato a Batismo | `CandidatoBatismo`, `candidatos_batismo` |
| Batismo realizado | Registro de Batismo | `RegistroBatismo`, `registros_batismo` |
| Entrada ou saída financeira | Lançamento Financeiro | `LancamentoFinanceiro`, `lancamentos_financeiros` |
| Classificação financeira | Categoria Financeira | `CategoriaFinanceira`, `categorias_financeiras` |
| Grupo organizacional | Departamento | `Departamento`, `departamentos` |
| Bem da igreja | Patrimônio | `Patrimonio`, `patrimonios` |
| Reunião religiosa recorrente | Culto | `Culto`, `cultos` |
| Atividade com data | Evento | `Evento`, `eventos` |
| Inscrição em evento | Inscrição de Evento | `InscricaoEvento`, `inscricoes_evento` |
| Conteúdo do pastor | Mensagem Pastoral | `MensagemPastoral`, `mensagens_pastorais` |
| Imagem rotativa do site | Imagem de Carrossel | `ImagemCarrossel`, `imagens_carrossel` |
| Autorização funcional | Permissão | `Permissao`, `permissoes` |
| Conjunto de permissões | Papel | `Papel`, `papeis` |
| Estado de negócio | Situação | `situacao`, Enum `Situacao...` |

## Distinções obrigatórias

- Tenant não é Congregação.
- Congregação é a única entidade técnica para matriz e filial; `tipo` diferencia `matriz` e `filial`.
- Igreja/Ministério são termos de interface para Tenant.
- Não usar Unidade, Church, Branch ou Igreja como sinônimo técnico de Congregação.
- Não usar Movimento Financeiro como sinônimo de Lançamento Financeiro.

## Exceções técnicas permitidas

`Tenant`, `Schema`, `Middleware`, `Job`, `Queue`, `Cache`, `Service`, `Repository`, `DTO`, `API`, `Webhook`, `Request`, `Policy`, `Model` e termos exigidos por Laravel/bibliotecas.

Identificadores técnicos em português não usam acentos. Textos de interface usam acentuação normal.


# 4. Requisitos funcionais

## RF-01 — Site principal

- Servir o conteúdo estático em `/`, sem Tenant Context.
- Não consultar banco da gestão para renderizar a página inicial.
- Links para login e sites de organizações podem apontar para `/gestao/login` e `/site/{slug}`.
- Falha ou manutenção da gestão não deve impedir a entrega dos arquivos estáticos já publicados.

## RF-02 — Onboarding de organização

O Tenant Provisioning cria o registro global, schema, Tenant Migrations e primeiro pastor presidente. O assistente exige:

- nome legal/exibido;
- slug público único;
- status inicial (`rascunho`, `ativa`, `suspensa`);
- sede/matriz obrigatória;
- dados da sede: nome, telefone, endereço e localização opcionais;
- identidade visual e logo;
- ao menos um culto inicial;
- mensagem pastoral inicial opcional;
- pastor presidente com acesso a toda a organização.

O onboarding usa transação e compensações. Falhas deixam estado `provisioning_failed`; nunca deixam Tenant parcial sem estado identificável.

## RF-03 — Organizações e unidades

- Admin da plataforma provisiona e administra metadados/status no landlord, sem acesso automático aos dados internos.
- Cada organização possui exatamente uma sede.
- Pastor presidente gerencia sede e filiais de sua organização.
- Filiais podem ser criadas sem limite funcional inicial.
- Unidade contém nome, tipo, telefone, início das atividades, CEP, endereço, complemento, cidade/UF, observações, coordenadas, ordem e logo opcional.
- A sede não pode ser excluída. Troca de sede exige operação específica, transacional e auditada.
- Unidades com histórico são arquivadas, não excluídas fisicamente.

## RF-04 — Usuários e acessos

- Listar apenas usuários visíveis no escopo do operador.
- Criar/convidar, editar, suspender e revogar usuários.
- Atribuir papel, organização e uma ou mais unidades.
- Permitir papel personalizado sem ultrapassar privilégios do concedente.
- Mostrar resumo do acesso por organização, unidade e módulo.
- Impedir autoexclusão e remoção dos últimos responsáveis obrigatórios.

## RF-05 — Dashboard

Exibir, respeitando o escopo atual:

- total de membros ativos;
- total de visitantes;
- total de crianças;
- candidatos a batismo;
- saldo financeiro, apenas se autorizado;
- movimentos recentes, apenas se autorizado;
- identificação clara da organização e unidade/filtro ativo.

O dashboard nunca consulta dois Tenant Schemas. Pastor presidente agrega congregações do Tenant; demais usuários somente as autorizadas. Métricas globais são agregadas/anonimizadas e separadas.

## RF-06 — Secretaria e pessoas

Reproduzir o cadastro atual de pessoas/membros:

- dados pessoais, nascimento, gênero, estado civil e escolaridade;
- CPF, RG, origem, nacionalidade, naturalidade e profissão;
- contatos e endereço;
- filiação, cônjuge e quantidade de filhos;
- cargo ministerial atual e anterior;
- datas de batismo e batismo no Espírito;
- forma/data de recepção e igreja anterior;
- observações, foto, status ativo e origem do cadastro;
- registros de consentimento e versão do termo LGPD.

Deve permitir busca, paginação, filtro por congregação/status, criação, edição e inativação. Unicidades são locais ao Tenant Schema quando aplicável.

## RF-07 — Visitantes

- Cadastrar nome, data, se frequenta outra igreja, nome da igreja, pastor, localização e observações.
- Listar, buscar, editar e excluir/inativar conforme política.
- Associar sempre a uma unidade.
- Secretário só opera visitantes de unidades autorizadas.

## RF-08 — Crianças

- Cadastrar nome, nascimento, apresentação, contatos, pai, mãe e apresentante.
- Associar a uma unidade.
- Listar, buscar, editar e excluir/inativar dentro do escopo.

## RF-09 — Batismos

- Cadastrar candidatos com unidade, pessoa opcional, nome, nascimento, contato, status e observações.
- Estados mínimos: `candidato`, `batizado`, `cancelado`.
- Ao marcar como batizado, criar/vincular membro e registro de batismo de forma transacional e idempotente.
- Não permitir pessoa, candidato e registro em organizações diferentes.

## RF-10 — Tesouraria

- Registrar entradas e saídas com tipo, descrição, valor, data, pessoa opcional, unidade e autor.
- Exibir totais de entradas, saídas, saldo e movimentos recentes.
- Filtrar por unidade e período.
- Tipos de receita/despesa podem ser padrões da plataforma ou específicos da organização.
- Exclusão deve preferencialmente cancelar/inativar o lançamento e registrar autor, data e motivo.
- Dados financeiros só aparecem para capacidades de tesouraria e unidades autorizadas.

## RF-11 — Cultos

- CRUD de cultos por unidade.
- Campos mínimos: título, dia, horário e ordem.
- O site público agrupa cultos por sede e filiais.
- Não usar `igreja_id = null` para representar sede; a sede é uma unidade explícita.

## RF-12 — Eventos e inscrições

- CRUD de eventos com título, data, descrição, foto, unidade, aceite de inscrições, limite e encerramento.
- Evento pode ser de congregação ou geral do Tenant. Evento geral usa `congregacao_id = null` e `escopo = tenant` explicitamente.
- Listar somente eventos futuros no site público, salvo página de histórico.
- Inscrições contêm pessoa opcional, nome, e-mail, telefone, status, data e observações.
- Respeitar prazo e limite de vagas sob concorrência, com transação/lock.
- Validar que pessoa, evento e inscrição pertencem à mesma organização.

## RF-13 — Gestão do site

- Editar nome público, nome reduzido, logo, texto institucional, contato e redes sociais.
- CRUD e ordenação de carrossel com imagem, título e subtítulo.
- CRUD e ordenação de mensagens pastorais com nome, título, local de atuação, mensagem e foto.
- Gerenciar cultos, eventos e unidades exibidos.
- Oferecer preview autenticado e publicação explícita.
- Conteúdos pertencem à organização; quando específicos de unidade, possuem `unidade_id`.

## RF-14 — Site público da organização

- URL canônica `/site/{tenant.slug}`; o slug resolve Tenant no landlord e nunca vira nome de schema.
- Exibir identidade visual, carrossel, institucional, mensagens pastorais, cultos, eventos futuros, unidades/mapa, contato e redes sociais.
- Exibir apenas conteúdo publicado e da organização resolvida pelo slug.
- Página pública de inscrição em evento pode usar `/site/{slug}/eventos/{evento}/inscricao`.
- Sites em rascunho, suspensos ou não publicados retornam `404`, exceto preview autorizado.

## RF-15 — Perfil e conta

- Alterar nome, e-mail e senha.
- Confirmar senha em operações sensíveis.
- Encerramento da própria conta não pode violar regras de último responsável.

## RF-16 — Auditoria

Registrar, no mínimo, com `tenant_id` em logs globais e `congregacao_id` quando aplicável:

- login, logout e falhas relevantes;
- criação, alteração, suspensão e revogação de usuários;
- mudança de papéis/unidades;
- troca de sede;
- publicação do site;
- alterações e cancelamentos financeiros;
- impersonação por suporte, se implementada.

Cada registro contém ator, organização, unidade opcional, ação, recurso, identificador, antes/depois sanitizados, IP e data.

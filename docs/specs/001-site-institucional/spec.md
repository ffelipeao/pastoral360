# SPEC-001 — Site institucional do Pastoral 360

## Contexto

Construir uma landing page estática, moderna, acessível e responsiva para apresentar o Pastoral 360 e converter visitantes em pedidos de demonstração. A visão completa do produto, a arquitetura de conteúdo e os requisitos gerais estão em `reference.md` nesta pasta.

## Restrições globais

- Implementar apenas informações confirmadas em `reference.md`.
- Não inventar clientes, depoimentos, métricas, preços ou garantias.
- Não simular envio bem-sucedido de formulário sem integração real.
- Manter o conteúdo em português do Brasil.
- Preservar acessibilidade por teclado, foco visível e redução de movimento.
- Não adicionar autenticação ou área interna do produto; o único processamento de servidor permitido neste MVP é o endpoint PHP de contato.

## Etapa 1 — Fundação técnica e tokens visuais

### Objetivo

Criar a base executável do site estático e o sistema visual mínimo que sustentará as próximas etapas.

### Requisitos

- Usar HTML semântico, CSS e JavaScript leve, salvo se o projeto já possuir uma stack definida antes da execução.
- Criar a estrutura de arquivos necessária para execução local.
- Configurar idioma `pt-BR`, viewport, título e descrição inicial.
- Definir tokens CSS para cores, tipografia, espaçamento, raios, sombras e larguras de conteúdo.
- Definir tokens semânticos para os temas claro e escuro, cobrindo fundo, superfícies, textos, bordas, sombras e cores de ação.
- Criar estilos globais, normalização, foco visível e utilitário de conteúdo exclusivo para leitores de tela.
- Aplicar o tema do sistema como preferência inicial sem causar flash visual perceptível durante o carregamento.
- Incluir instruções curtas para executar e validar o projeto localmente.

### Critérios de aceite

- A página abre localmente sem erro de console.
- A apresentação do site não depende de backend; somente o envio do formulário requer PHP.
- Os tokens visuais são reutilizáveis e não há valores repetidos sem necessidade.
- Os temas claro e escuro mantêm legibilidade e contraste adequado.
- O documento possui estrutura inicial válida e linguagem `pt-BR`.
- O foco de teclado é claramente visível.

## Etapa 2 — Cabeçalho e hero responsivos

### Objetivo

Comunicar a proposta de valor imediatamente e oferecer caminhos claros para conhecer os recursos ou solicitar uma demonstração.

### Requisitos

- Implementar cabeçalho com marca, navegação por âncoras e CTA principal.
- Implementar menu móvel acessível, com estado aberto/fechado e fechamento após navegação.
- Adicionar botão de alternância entre tema claro e escuro, com ícone, nome acessível e estado atual compreensível.
- Persistir a escolha manual no navegador; na ausência de escolha, acompanhar `prefers-color-scheme` do sistema.
- Criar hero com selo, título, texto de apoio e CTAs primária e secundária definidos em `reference.md`.
- Criar uma representação visual do dashboard sem afirmar dados reais.
- Garantir hierarquia adequada com um único `h1`.

### Critérios de aceite

- Cabeçalho e hero funcionam sem rolagem horizontal entre 360 px e 1440 px.
- O menu móvel funciona com mouse, toque e teclado e expõe seu estado às tecnologias assistivas.
- O controle de tema funciona com mouse, toque e teclado, persiste após recarregar e não depende apenas do ícone para comunicar sua ação.
- Os CTAs apontam para âncoras existentes.
- A proposta de valor e a ação principal aparecem antes da primeira rolagem nas larguras usuais.

## Etapa 3 — Problemas, recursos e módulos

### Objetivo

Apresentar a transformação oferecida pelo Pastoral 360 e todos os módulos de forma clara, agrupada e fácil de explorar.

### Requisitos

- Criar seção que contraste informações dispersas com gestão centralizada.
- Criar a seção `Recursos` com os quatro grupos descritos em `reference.md`.
- Incluir todos os módulos: Secretaria, Tesouraria, patrimônio, relatórios, novos convertidos, candidatos ao batismo, apresentação de crianças com certificado, membros, pequenos grupos, cultos e eventos, EBD, site público e departamentos.
- Usar cartões consistentes com ícone, título e descrição curta.
- Utilizar ícones de uma única família visual ou SVGs locais consistentes.
- Revelar os cards de forma progressiva quando entrarem na área visível, usando uma animação curta de opacidade e deslocamento sutil.
- Implementar a revelação de modo eficiente, preferencialmente com `IntersectionObserver`, evitando listeners contínuos de rolagem.

### Critérios de aceite

- Todos os módulos previstos aparecem uma única vez ou têm repetição justificada pelo contexto.
- Os grupos são distinguíveis visualmente e compreensíveis sem interação.
- Ícones decorativos não geram ruído para leitores de tela.
- A grade se adapta corretamente a celular, tablet e desktop.
- Cada card é animado no máximo uma vez e permanece visível depois da entrada.
- Com JavaScript indisponível ou redução de movimento ativa, todos os cards permanecem visíveis sem transição obrigatória.

## Etapa 4 — Filiais, perfis e funcionamento

### Objetivo

Evidenciar a gestão de múltiplas igrejas e traduzir os recursos em benefícios para cada perfil de usuário.

### Requisitos

- Criar seção de destaque para sede, filiais e acessos limitados à própria filial.
- Apresentar os benefícios para Liderança, Secretaria, Tesouraria, Líderes de departamento e Comunicação.
- Se benefícios forem apresentados em abas, implementar semântica e navegação por teclado; cartões estáticos também são aceitos.
- Implementar o fluxo de três passos descrito em `reference.md`.
- Não fazer afirmações técnicas de segurança ou conformidade ainda não confirmadas.

### Critérios de aceite

- O diferencial de gestão de filiais é localizado e entendido rapidamente.
- Cada perfil possui benefício específico, sem texto genérico repetido.
- Todo o conteúdo permanece acessível sem animação e sem depender de hover.
- O fluxo comercial tem ordem clara em todas as larguras.

## Etapa 5 — FAQ, conversão e rodapé

### Objetivo

Responder às dúvidas principais e concluir a jornada com opções de contato transparentes.

### Requisitos

- Criar FAQ com as perguntas iniciais de `reference.md`, usando apenas respostas confirmadas.
- Implementar CTA final para demonstração.
- Criar formulário com nome, igreja, cidade/UF, telefone com WhatsApp obrigatório, e-mail opcional e mensagem.
- Validar campos obrigatórios no navegador e apresentar mensagens acessíveis.
- Enviar o formulário pelo endpoint PHP para `contato@pastoral360.com.br`, com validação no servidor, consentimento e proteção anti-spam.
- Adicionar link de WhatsApp apenas quando houver número configurado; até lá, usar configuração central identificável sem número fictício.
- Criar rodapé com marca, navegação, contatos configurados e ano automático.

### Critérios de aceite

- FAQ e formulário são totalmente operáveis por teclado.
- Estados de erro são associados aos respectivos campos e não dependem apenas de cor.
- Nenhum contato, rede social ou política inexistente é apresentado como real.
- O formulário não perde dados nem informa sucesso falso.
- Falhas do servidor mantêm o WhatsApp como alternativa visível de contato.

## Etapa 6 — SEO, ativos e acabamento visual

### Objetivo

Preparar a landing page para compartilhamento, indexação e apresentação visual consistente.

### Requisitos

- Revisar título, descrição, canonical configurável e metadados Open Graph.
- Adicionar favicon e imagem social próprios quando os ativos estiverem disponíveis; manter fallback honesto enquanto forem provisórios.
- Otimizar imagens e definir dimensões para evitar deslocamentos de layout.
- Adicionar movimentos sutis apenas quando ajudarem a hierarquia visual.
- Respeitar `prefers-reduced-motion`.
- Revisar superfícies, imagens, ícones, estados interativos e sombras nos temas claro e escuro.
- Usar dados estruturados somente com informações confirmadas.

### Critérios de aceite

- Metadados não contêm domínio, números ou imagens fictícias.
- Imagens informativas têm texto alternativo adequado e imagens decorativas são ignoradas por leitores de tela.
- A página permanece compreensível com animações desativadas.
- Não há dependência pesada adicionada apenas para efeitos visuais.
- A troca de tema não causa perda de contraste, conteúdo ilegível ou elementos com cores fixas incompatíveis.

## Etapa 7 — Verificação final e documentação

### Objetivo

Validar o MVP completo contra os requisitos e registrar uma forma confiável de publicá-lo.

### Requisitos

- Testar a página nas larguras de 360 px, 768 px, 1024 px e 1440 px.
- Verificar navegação por teclado, foco, ordem dos títulos, labels e contraste.
- Validar links internos, menu, alternância de tema, animações de entrada, FAQ, formulário e ano do rodapé.
- Executar as verificações automatizadas disponíveis no projeto.
- Auditar desempenho, acessibilidade, boas práticas e SEO quando Lighthouse estiver disponível.
- Documentar execução local, build quando aplicável e publicação em hospedagem estática.
- Registrar exceções ou dependências externas que impeçam algum critério.

### Critérios de aceite

- Não há erro no console, link quebrado ou rolagem horizontal nas larguras de referência.
- O fluxo principal funciona com teclado e em dispositivo móvel.
- Os temas claro e escuro e a preferência de redução de movimento foram verificados.
- Todos os critérios gerais de aceite de `reference.md` foram verificados ou registrados como pendência explícita.
- A documentação permite que outra pessoa execute e publique o site.

## Executar com o orquestrador

Na raiz do projeto, execute:

```bash
python3 automation/orchestrator.py docs/specs/001-site-institucional/
```

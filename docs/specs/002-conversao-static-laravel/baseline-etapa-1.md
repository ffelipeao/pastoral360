# Baseline do site estático — Etapa 1

Registro da fonte canônica em `index.html`, `assets/`, `.htaccess` e `scripts/validate.mjs` antes da conversão para Blade. O site estático permanece inalterado na raiz.

## Validação preexistente

Executada na raiz com `node scripts/validate.mjs` antes das alterações. Resultado: sucesso, com 17 links internos, 21 IDs, nenhum campo de formulário e 7 ativos locais verificados. Não havia falha preexistente a corrigir.

## Configuração local da fundação Laravel

- O arquivo `laravel/.env.example` recomenda PostgreSQL sem senha preenchida e mantém `APP_DEBUG=false` como padrão seguro.
- Para usar SQLite localmente, copie `.env.example` para um `.env` local ignorado pelo Git, crie `laravel/database/database.sqlite` e altere `DB_CONNECTION` para `sqlite` e `DB_DATABASE` para o caminho absoluto do arquivo, conforme o bloco comentado no exemplo.
- O `.env` local não faz parte do baseline e não deve ser versionado.

## Conteúdo e estrutura

- Cabeçalho com marca, seis itens de navegação e CTA para demonstração.
- Hero com proposta principal, dois CTAs e representação ilustrativa do painel construída em HTML/CSS.
- Transformação “Antes” e “Com a Pastoral 360”.
- Recursos em quatro grupos: administração e finanças; pessoas e jornada pastoral; cultos e formação; comunicação e ministérios.
- Gestão de filiais, benefícios por perfil, fluxo comercial em três passos, quatro planos, período grátis de 30 dias, FAQ, contato e rodapé.
- Planos e preços: Essencial (R$ 49,90/mês), Gestão (R$ 79,90/mês), Completo (R$ 129,90/mês) e Multi-Igrejas (a partir de R$ 199,90/mês).

## Âncoras e links

- Âncoras navegáveis: `inicio`, `recursos`, `para-sua-igreja`, `filiais`, `planos` e `contato`.
- IDs de suporte semântico: `site-navigation`, `conteudo-principal`, `hero-title`, `transformation-title`, `resources-title`, `group-admin-title`, `group-people-title`, `group-formation-title`, `group-communication-title`, `branches-title`, `profiles-title`, `how-it-works-title`, `pricing-title`, `faq-title` e `contact-title`.
- O único destino externo acionável é `https://wa.me/5521964239334`, sempre aberto em nova aba com `noopener noreferrer`.
- A marca do cabeçalho aponta para `index.html`; não existem formulários, e-mail, telefone clicável ou outros destinos externos no HTML inicial.

## Metadados e dados estruturados

- Idioma `pt-BR`, UTF-8, viewport responsiva, descrição e `robots=index, follow`.
- Open Graph: locale, tipo, nome do site, título e descrição.
- Twitter Card: cartão `summary`, título e descrição.
- Título: “Pastoral 360 | Gestão integrada para igrejas”.
- Google Analytics carrega `G-BWZTSJYEZ9`.
- JSON-LD descreve um `SoftwareApplication` chamado Pastoral 360, em `pt-BR`.
- Canonical, `og:url` e imagem social só são adicionados pelo JavaScript quando uma URL pública válida e uma imagem forem preenchidas em `SITE_CONFIG`; ambos estão vazios no baseline.

## Imagens e ativos

- `assets/images/icone.png`: marca do cabeçalho e Apple Touch Icon, PNG RGBA 1254 × 1254.
- `assets/images/Logo1.png`: marca do rodapé, PNG RGB 1254 × 1254.
- `assets/images/pastoral360-favicon.svg`: favicon ativo.
- `assets/images/favicon.svg`: arquivo disponível, mas não referenciado pela página.
- `assets/css/styles.css` e `assets/js/main.js` são carregados diretamente. A ilustração do painel e os ícones das seções usam HTML/CSS e SVG inline.

## Tema, responsividade e movimento

- Há apenas tema claro, declarado por `color-scheme: light`; não existe alternância nem preferência persistida.
- Breakpoints principais em `63.9375rem` e `35rem` reorganizam navegação, grades, CTAs, filiais e rodapé.
- Cards recebem revelação progressiva via `IntersectionObserver`, atraso escalonado de 70 ms e deixam de ser observados após aparecerem.
- Com `prefers-reduced-motion: reduce`, o conteúdo permanece visível e animações, transições e rolagem suave são reduzidas.

## Menu móvel, FAQ e conteúdo dinâmico

- O menu móvel atua até `63.9375rem`, alterna `aria-expanded`, texto acessível, classe visual e bloqueio de rolagem do corpo.
- Fecha ao selecionar um link, clicar fora, pressionar Escape ou sair do breakpoint; Escape devolve o foco ao botão.
- A FAQ contém cinco itens nativos `details`/`summary`, sem JavaScript adicional.
- O ano do rodapé é preenchido com o ano atual pelo JavaScript.

## WhatsApp

- Número configurado: `5521964239334`.
- CTA principal e botão flutuante recebem a mensagem: “Olá! Gostaria de conhecer a Pastoral 360 e solicitar uma demonstração.”
- Cada plano recebe uma mensagem própria com nome e preço.
- O contato “WhatsApp: (21) 96423-9334” é inserido no rodapé e substitui o aviso de indisponibilidade quando a configuração é válida.
- O botão flutuante permanece fixo e visível; sem JavaScript, os links conservam o destino base `wa.me` sem texto personalizado.

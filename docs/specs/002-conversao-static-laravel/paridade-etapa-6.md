# Paridade final — Etapa 6

Registro da comparação do site Laravel com o baseline de
`baseline-etapa-1.md`. A remoção de `index.html`, `assets/` e `.htaccess` da
raiz está bloqueada até a conclusão das verificações pendentes abaixo.

## Resultado

- Conteúdo e SEO: título, descrição, robots, Open Graph, Twitter Card, JSON-LD,
  Analytics, textos, preços, telefone, CTAs, âncoras e ordem das seções foram
  preservados.
- Layout e responsividade: o CSS-fonte é idêntico ao baseline. A inspeção em
  navegador nas larguras de 360, 768, 1024 e 1440 px não pôde ser executada
  neste ambiente.
- Acessibilidade: um único `h1`, hierarquia de títulos, idioma, landmarks,
  nomes acessíveis, foco visível, navegação por teclado, Escape no menu móvel e
  FAQ nativa com `details`/`summary` preservados.
- Interações: menu móvel, fechamento por clique externo/Escape, links de
  WhatsApp, ano automático e revelação progressiva mantidos.
- Movimento: com `prefers-reduced-motion: reduce`, conteúdo visível e animações,
  transições e rolagem suave reduzidas conforme o baseline.
- Assets locais: a validação do HTML renderizado encontrou e leu CSS,
  JavaScript, favicon e imagens do build existente sem ausências.
- Temas: o baseline oferece somente tema claro (`color-scheme: light`), portanto
  a preferência escura deve continuar exibindo o tema claro intencionalmente.
  Essa confirmação visual, console e rede ainda depende de navegador disponível.

## Diferenças inevitáveis

- Os caminhos públicos de CSS, JavaScript e imagens possuem hashes gerados pelo
  Vite, em vez dos caminhos fixos `assets/`.
- A marca do cabeçalho aponta para a rota `/`, em vez de `index.html`.
- O HTML contém URLs absolutas produzidas pelos helpers Laravel/Vite conforme o
  ambiente. Conteúdo, semântica e identidade visual não mudam.
- `@@context` e `@@type` no fonte Blade são renderizados como `@context` e
  `@type`, evitando a interpretação desses campos JSON-LD pelo Blade.

## Validações executadas

- Testes Laravel e Pint.
- Validação estática sobre o HTML renderizado e requisições dos assets locais.
- Testes do empacotamento Kinghost e modo `--validate` do deploy.

## Pendências e riscos

- `npm install` não concluiu por indisponibilidade de acesso ao registry e o
  cache local não contém o Vite; por isso, o build de produção não foi refeito.
- O navegador integrado não está disponível e o sandbox bloqueia servidor
  local; faltam console, rede, teclado e inspeção visual em 360, 768, 1024 e
  1440 px, em preferências clara, escura e de movimento reduzido.
- `index.html`, `assets/` e `.htaccess` foram preservados na raiz. Só devem ser
  removidos após as duas validações anteriores passarem sem regressões.
- Canonical, `og:url` e imagem social permanecem condicionados à configuração
  pública de `SITE_CONFIG`, como no baseline. A validação pós-deploy continua
  necessária para certificado, Apache, proxy e variáveis do servidor.

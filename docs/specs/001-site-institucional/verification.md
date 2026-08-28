# Verificação e publicação do MVP

Este documento registra as verificações reproduzíveis da Etapa 7. Ele deve ser
atualizado na URL definitiva sempre que contatos, metadados ou ativos forem
configurados.

## Verificações automatizadas

Na raiz do projeto, execute:

```bash
node scripts/validate.mjs
node --check assets/js/main.js
tidy -errors -quiet index.html
```

O primeiro comando verifica IDs duplicados, destinos das âncoras, ordem dos
títulos, ativos locais e os ganchos de menu, FAQ, WhatsApp,
ano automático, foco e redução de movimento. O `tidy` é complementar e pode
retornar código 1 ao emitir avisos sobre elementos vazios usados exclusivamente
na ilustração CSS; revise a saída para distinguir esses avisos de erros reais.

Na execução de 28/08/2026, o validador conferiu 15 links internos, 31 IDs, cinco
campos e três ativos locais sem falhas. `node --check` também terminou sem erro.
O `tidy` retornou código 1 somente com avisos de elementos decorativos vazios.

## Checklist manual no navegador

Inicie `python3 -m http.server 8000`, abra `http://localhost:8000` e repita os
itens abaixo em 360 px, 768 px, 1024 px e 1440 px:

- confirmar que `document.documentElement.scrollWidth` não supera
  `document.documentElement.clientWidth`;
- confirmar ausência de erros no console e de respostas 404 na aba de rede;
- abrir e fechar o menu com Enter e Espaço, seguir cada link e fechar com Esc;
- percorrer a página com Tab e Shift+Tab, verificando foco visível e ordem lógica;
- abrir e fechar todas as perguntas da FAQ pelo teclado;
- acionar a chamada principal e o botão flutuante do WhatsApp e confirmar número
  e mensagem pré-preenchida;
- conferir visualmente títulos, labels, contraste, áreas de toque e o ano atual
  no rodapé;
- testar todos os links de cabeçalho, CTAs e rodapé.

## Critérios gerais do MVP

- [x] Mensagem principal, módulos, filiais, acessos limitados e CTAs estão na página.
- [x] Não há métricas, clientes, depoimentos, preços ou garantias inventadas.
- [x] O WhatsApp é o único canal de contato e permanece disponível durante a navegação.
- [x] HTML possui um único `h1`, sequência de títulos e labels associados.
- [x] Links internos, ativos locais e ano automático passaram na validação estática.
- [x] As combinações principais de texto e fundo variam de 4,92:1 a 16,29:1;
  foco, erro e textos sobre fundos escuros também atendem ao mínimo AA.
- [ ] Confirmar visualmente responsividade e ausência de rolagem horizontal nas quatro larguras.
- [ ] Confirmar em navegador real console, rede, fluxo completo por teclado, foco e contraste renderizado.
- [ ] Executar Lighthouse mobile e buscar 90+ em Desempenho, Acessibilidade, Boas Práticas e SEO.
- [ ] Revisar a URL definitiva, metadados sociais, imagem de compartilhamento e contatos antes da publicação.

## Dependências e exceções

- A URL oficial, redes sociais, política de privacidade e responsável pelo
  tratamento de dados ainda dependem de confirmação externa. O WhatsApp
  comercial já está configurado.
- A imagem social personalizada não foi configurada porque não há URL oficial nem
  ativo confirmado. O favicon local é provisório e não representa logotipo oficial.
- O código contém um identificador de Google Analytics preexistente. Antes da
  publicação, o responsável deve confirmar sua propriedade e o fluxo de
  consentimento aplicável.
- Nesta execução, o ambiente bloqueou a abertura de porta local e o navegador
  integrado não estava disponível. Por isso, os itens manuais e o Lighthouse
  permanecem pendentes e a Etapa 7 não pode ser declarada concluída.

## Publicação

Não existe build. Depois de preencher somente configurações confirmadas e concluir
os itens pendentes, publique `index.html` e `assets/` na raiz de uma hospedagem
estática. Habilite HTTPS, configure a URL oficial em `SITE_CONFIG`, valide os
metadados na URL pública e repita toda a auditoria após o deploy.

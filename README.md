# Portal Pastoral 360

Base estática do site institucional, construída com HTML, CSS e JavaScript sem
dependências de backend.

## Executar localmente

Na raiz do projeto, inicie um servidor HTTP local:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000` no navegador.

## Validar

Execute a validação automatizada da estrutura, dos links internos, dos labels,
da hierarquia de títulos, dos ativos e dos ganchos de interação:

```bash
node scripts/validate.mjs
node --check assets/js/main.js
```

Não há etapa de build: os arquivos da raiz e a pasta `assets/` são o artefato
publicável. O checklist completo, incluindo os testes manuais, está em
[`docs/specs/001-site-institucional/verification.md`](docs/specs/001-site-institucional/verification.md).

## Publicar em hospedagem estática

1. Configure em `assets/js/main.js` apenas os dados comerciais confirmados em
   `SITE_CONFIG` (URL oficial, imagem social e canais de contato).
2. Execute os comandos da seção **Validar** e conclua o checklist manual.
3. Publique `index.html`, `.htaccess` e a pasta `assets/`, preservando a
   estrutura de caminhos e garantindo que arquivos iniciados por ponto sejam
   incluídos no deploy.
4. Configure o diretório publicado como raiz do site, habilite HTTPS na
   hospedagem e confirme que o redirecionamento de HTTP para HTTPS funciona.
5. Após publicar, repita o checklist na URL definitiva e execute o Lighthouse
   em modo móvel.

Serviços como GitHub Pages, Netlify, Cloudflare Pages ou hospedagens equivalentes
podem servir estes arquivos diretamente, sem comando de build.

## Segurança e privacidade na KingHost

O arquivo `.htaccess` desabilita listagem de diretórios, força HTTPS e configura
cabeçalhos contra interpretação indevida de conteúdo, enquadramento por páginas
externas e acesso desnecessário a recursos do dispositivo. Depois do deploy,
confirme no painel da KingHost que o certificado SSL está ativo antes de testar o
redirecionamento.

A política de conteúdo permite somente os ativos locais, o Google Analytics já
presente no projeto e suas conexões necessárias. Caso outro serviço externo seja
adicionado, revise a `Content-Security-Policy` de forma restritiva.

O Google Analytics atualmente carrega assim que a página é aberta. Antes da
publicação definitiva, valide a necessidade de consentimento e de uma política de
privacidade conforme o fluxo de dados adotado e a LGPD. Senhas, tokens e acessos
da KingHost nunca devem ser adicionados ao repositório.

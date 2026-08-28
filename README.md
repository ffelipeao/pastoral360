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
3. Publique `index.html` e a pasta `assets/` preservando a estrutura de caminhos.
4. Configure o diretório publicado como raiz do site e habilite HTTPS na
   hospedagem.
5. Após publicar, repita o checklist na URL definitiva e execute o Lighthouse
   em modo móvel.

Serviços como GitHub Pages, Netlify, Cloudflare Pages ou hospedagens equivalentes
podem servir estes arquivos diretamente, sem comando de build.

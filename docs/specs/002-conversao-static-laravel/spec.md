# SPEC-002 — Conversão do site estático para Laravel 12

## Contexto

Converter o site institucional estático existente na raiz do repositório para Laravel 12, preservando integralmente o template, conteúdo, identidade visual, acessibilidade, SEO e comportamentos atuais. O resultado deve usar o mesmo layout de diretórios da hospedagem Kinghost: o núcleo da aplicação em `laravel/` e somente arquivos públicos em `www/`.

Os arquivos atuais `index.html`, `assets/`, `.htaccess`, `scripts/validate.mjs` e `scripts/deploy-kinghost.sh` são a fonte canônica para a migração. A implementação deve comparar o resultado Laravel com essa versão antes de remover qualquer arquivo legado.

## Dependências

- PHP 8.2 ou superior com `pdo`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json` e `bcmath`.
- Composer.
- Node.js e npm para o fluxo de assets com Vite.
- PostgreSQL em produção e SQLite como opção para desenvolvimento e testes locais.

## Restrições globais

- Usar Laravel 12 e versões de dependências compatíveis com ele.
- Manter em `laravel/` o projeto completo: `app`, `bootstrap`, `config`, `database`, `resources`, `routes`, `storage`, `tests`, `vendor`, `.env` local e `artisan`.
- Manter em `www/` somente arquivos publicamente acessíveis, como `index.php`, `.htaccess`, assets compilados, favicon e link público de storage quando necessário.
- Configurar `laravel/bootstrap/app.php` com `usePublicPath` para que o Laravel reconheça `www/` como diretório público, inclusive ao executar `php artisan serve` dentro de `laravel/`.
- Não alterar textos, preços, telefone, links, metadados, hierarquia semântica, estilos ou interações sem exigência técnica comprovada.
- Não adicionar autenticação, painel administrativo, multi-tenancy, banco obrigatório ou novas funcionalidades nesta spec.
- Não expor `.env`, fontes, testes, dependências, storage privado ou arquivos internos pelo diretório `www/`.
- Não remover a versão estática da raiz antes da validação de paridade da etapa final.
- Não versionar `.env`, credenciais, segredos, `vendor/`, `node_modules/` ou artefatos locais desnecessários.

## Etapa 1 — Baseline visual e fundação Laravel 12

### Objetivo

Registrar o comportamento atual e criar uma aplicação Laravel 12 mínima no layout definitivo sem ainda converter o template.

### Requisitos

- Inventariar conteúdo, âncoras, links externos, metadados, dados estruturados, imagens, temas, menu móvel, FAQ, animações e comportamento do WhatsApp existentes.
- Executar as validações estáticas atuais e registrar qualquer falha preexistente sem corrigi-la silenciosamente.
- Criar o projeto Laravel 12 em `laravel/` e o diretório público `www/`.
- Mover/adaptar o front controller público para `www/index.php`, apontando corretamente para `../laravel/vendor/autoload.php` e `../laravel/bootstrap/app.php`.
- Configurar `usePublicPath` em `laravel/bootstrap/app.php` para `www/` por caminho absoluto resolvido a partir da aplicação.
- Preparar `.env.example` com configuração segura para PostgreSQL e documentar a alternativa SQLite local, sem criar ou alterar `.env` versionado.
- Ajustar `.gitignore` para o layout e criar teste HTTP mínimo para a rota raiz.

### Critérios de aceite

- `php laravel/artisan --version` informa Laravel Framework 12.x.
- `php laravel/artisan serve` usa `www/` como raiz pública.
- Uma requisição de teste à rota `/` responde com sucesso, ainda que temporariamente use uma view mínima.
- Acesso HTTP direto a arquivos internos de `laravel/` não é possível pelo document root.
- O site estático original permanece disponível como referência nesta etapa.

## Etapa 2 — Migração fiel do template para Blade

### Objetivo

Converter o HTML atual em uma view Blade sem alterar conteúdo, semântica ou aparência.

### Requisitos

- Criar uma view Blade para a página inicial usando `index.html` como fonte canônica.
- Preservar todos os textos, seções, IDs de âncora, ordem de conteúdo, elementos semânticos, atributos ARIA, JSON-LD e metadados SEO/Open Graph.
- Substituir apenas caminhos físicos por helpers Laravel apropriados, como `asset()` e `url()`, sem gerar URLs quebradas.
- Manter o Google Analytics existente e os links de WhatsApp com os mesmos parâmetros e proteções atuais.
- Registrar a rota `/` em `routes/web.php`, sem dependência de autenticação ou banco de dados.
- Criar testes que confirmem status, conteúdo principal, âncoras, metadados, telefone, planos e referências aos assets.

### Critérios de aceite

- A resposta de `/` contém todo o conteúdo relevante presente no HTML estático.
- Não há escaping indevido, diretivas Blade visíveis ou HTML estruturalmente inválido.
- Links internos e externos preservam os destinos atuais.
- A página funciona quando o banco está indisponível.
- O teste de conteúdo detectaria a remoção acidental de seções, planos ou CTAs.

## Etapa 3 — Assets com Vite e diretório público externo

### Objetivo

Integrar CSS, JavaScript, imagens e ícones ao fluxo do Laravel/Vite mantendo paridade visual e comportamento.

### Requisitos

- Levar os fontes CSS e JavaScript atuais para a estrutura de resources do Laravel sem reescrever lógica desnecessariamente.
- Configurar Vite para gerar o build dentro de `www/build/`, com manifesto e URLs compatíveis com desenvolvimento e produção.
- Organizar imagens e favicon como assets versionados ou arquivos públicos conforme a necessidade técnica, sem duplicações desnecessárias.
- Atualizar a view Blade para carregar assets pelo mecanismo do Laravel/Vite.
- Preservar tema claro/escuro, persistência da preferência, menu móvel, revelação progressiva, FAQ, ano automático e mensagens personalizadas de WhatsApp.
- Garantir que ausência de JavaScript e `prefers-reduced-motion` mantenham o conteúdo acessível.

### Critérios de aceite

- `npm run build`, executado em `laravel/`, gera assets referenciados corretamente em `www/build/`.
- Não há 404 de CSS, JavaScript, imagens, favicon ou manifesto.
- Não existe conteúdo-fonte sensível ou desnecessário publicado em `www/`.
- A apresentação nas larguras 360, 768, 1024 e 1440 px mantém paridade com o template original.
- Console, navegação, tema, FAQ e WhatsApp funcionam sem regressões.

## Etapa 4 — Segurança do document root e configuração de ambientes

### Objetivo

Preparar o layout para desenvolvimento local e hospedagem compartilhada sem expor o núcleo Laravel.

### Requisitos

- Criar `www/.htaccess` compatível com o front controller Laravel, HTTPS/canonical quando configurados e preservação de arquivos estáticos existentes.
- Garantir que `www/index.php` use caminhos relativos robustos para o diretório irmão `laravel/`.
- Documentar configurações de `APP_URL`, proxy/HTTPS, sessão, cache, logs e banco para desenvolvimento e produção.
- Manter SQLite utilizável em testes/desenvolvimento e PostgreSQL como configuração recomendada para produção.
- Configurar páginas de erro e modo de produção sem exibir stack traces ou variáveis de ambiente.
- Criar testes ou verificações para arquivos sensíveis, traversal, fallback de rotas e headers essenciais quando suportados pela hospedagem.

### Critérios de aceite

- O document root pode ser apontado exclusivamente para `www/`.
- URLs amigáveis chegam ao front controller sem expor `index.php`.
- `.env`, `artisan`, `composer.json`, logs, testes e storage privado não são servidos.
- A aplicação funciona com SQLite local e possui configuração documentada para PostgreSQL.
- `APP_DEBUG=false` não revela detalhes internos em respostas de erro.

## Etapa 5 — Deploy Kinghost reproduzível

### Objetivo

Adaptar o processo de publicação para enviar o núcleo a `~/laravel` e os arquivos públicos a `~/www` com segurança.

### Requisitos

- Atualizar `scripts/deploy-kinghost.sh` para trabalhar a partir da raiz do repositório com os diretórios `laravel/` e `www/`.
- Validar explicitamente origem, destino e variáveis obrigatórias antes de sincronizar arquivos.
- Excluir `.env`, `.git`, testes locais, caches transitórios e dependências de desenvolvimento conforme a estratégia escolhida.
- Executar build de produção e comandos Laravel necessários em ordem segura, incluindo cache de configuração/rotas/views somente quando compatíveis com o ambiente.
- Preservar o `.env` e dados persistentes existentes no servidor.
- Documentar primeira publicação, atualizações, permissões de `storage/` e `bootstrap/cache/`, manutenção e rollback.
- Não executar deploy real durante a implementação ou os testes desta spec.

### Critérios de aceite

- O script possui modo de simulação ou validação que não altera o servidor.
- Um pacote/ensaio de deploy contém os arquivos corretos nos destinos `laravel/` e `www/`.
- Nenhum segredo ou arquivo privado é incluído no conteúdo público.
- Falha de build, teste ou validação interrompe o deploy antes da publicação.
- O procedimento de rollback é claro e preserva `.env`, storage e banco.

## Etapa 6 — Paridade final e remoção da estrutura estática legada

### Objetivo

Comprovar que o Laravel reproduz o site atual e concluir a migração sem manter duas fontes concorrentes.

### Requisitos

- Comparar o site Laravel com o baseline da etapa 1 em conteúdo, layout, responsividade, temas, acessibilidade, SEO e interações.
- Executar testes Laravel, Pint, build Vite, validação de links e a verificação estática adaptada ao HTML renderizado.
- Verificar console e rede nas larguras 360, 768, 1024 e 1440 px, em temas claro e escuro e com redução de movimento.
- Atualizar o README principal com instalação, execução, build, testes e deploy usando as pastas corretas.
- Após a paridade ser comprovada, remover da raiz apenas os arquivos estáticos substituídos (`index.html`, `assets/` e `.htaccess`), preservando scripts e documentação ainda utilizados.
- Registrar diferenças inevitáveis e pendências explícitas; não declarar conclusão com regressões conhecidas.

### Critérios de aceite

- O site renderizado mantém o mesmo conteúdo e identidade visual do template original.
- Não existem links quebrados, assets ausentes, erros no console ou rolagem horizontal nas larguras de referência.
- Navegação por teclado, foco, contraste, títulos, labels e preferências de movimento continuam funcionais.
- O repositório possui uma única fonte ativa do template em Blade/resources.
- Outra pessoa consegue instalar, testar, construir e publicar seguindo somente o README.

## Executar com o orquestrador

Na raiz do repositório, liste as etapas:

```bash
python3 automation/orchestrator.py docs/specs/002-conversao-static-laravel/ --list-steps
```

Execute uma etapa por vez, começando pela fundação:

```bash
python3 automation/orchestrator.py docs/specs/002-conversao-static-laravel/ --from-step 1 --to-step 1
```

Depois de revisar e versionar cada resultado, prossiga para a próxima etapa. Para executar todo o intervalo automaticamente:

```bash
python3 automation/orchestrator.py docs/specs/002-conversao-static-laravel/
```

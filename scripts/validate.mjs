import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const target = process.argv[2];
const baseUrl = new URL(target ?? 'http://localhost/');
const validateLocalBuild = target === undefined;
const failures = [];
const execFileAsync = promisify(execFile);

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function fetchText(url, label) {
  if (validateLocalBuild) {
    try {
      const path = new URL(url).pathname.replace(/^\/+/, '');
      return await readFile(new URL(`../www/${path}`, import.meta.url), 'utf8');
    } catch (error) {
      failures.push(`${label} não pôde ser lido no build local: ${url} (${error.message})`);
      return '';
    }
  }

  try {
    const response = await fetch(url, { redirect: 'follow' });
    check(response.ok, `${label} retornou HTTP ${response.status}: ${url}`);
    return response.ok ? await response.text() : '';
  } catch (error) {
    failures.push(`${label} não pôde ser carregado: ${url} (${error.message})`);
    return '';
  }
}

let html;
if (validateLocalBuild) {
  try {
    const render = 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $response = $app->handle(Illuminate\\Http\\Request::create("/", "GET")); fwrite(STDOUT, $response->getContent());';
    ({ stdout: html } = await execFileAsync('php', ['-r', render], {
      cwd: new URL('../laravel/', import.meta.url),
      env: {
        ...process.env,
        APP_ENV: 'testing',
        APP_KEY: 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        CACHE_STORE: 'array',
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: ':memory:',
        SESSION_DRIVER: 'array',
      },
      maxBuffer: 4 * 1024 * 1024,
    }));
  } catch (error) {
    failures.push(`A página Laravel não pôde ser renderizada (${error.message})`);
    html = '';
  }
} else {
  html = await fetchText(baseUrl, 'Página renderizada');
}
if (!html) {
  console.error('Validação falhou:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const assetPaths = [...html.matchAll(/\s(?:src|href)="([^"#]+)"/g)]
  .map((match) => match[1])
  .filter((path) => {
    const url = new URL(path, baseUrl);
    return url.origin === baseUrl.origin && url.pathname !== '/';
  });
const uniqueAssetUrls = [...new Set(assetPaths.map((path) => new URL(path, baseUrl).href))];
const assetContents = new Map();

await Promise.all(uniqueAssetUrls.map(async (url) => {
  assetContents.set(url, await fetchText(url, 'Ativo local'));
}));

let css = [...assetContents.entries()]
  .filter(([url]) => new URL(url).pathname.endsWith('.css'))
  .map(([, content]) => content)
  .join('\n');
let javascript = [...assetContents.entries()]
  .filter(([url]) => new URL(url).pathname.endsWith('.js'))
  .map(([, content]) => content)
  .join('\n');

if (validateLocalBuild) {
  css += `\n${await readFile(new URL('../laravel/resources/css/app.css', import.meta.url), 'utf8')}`;
  javascript += `\n${await readFile(new URL('../laravel/resources/js/app.js', import.meta.url), 'utf8')}`;
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
check(duplicateIds.length === 0, `IDs duplicados: ${[...new Set(duplicateIds)].join(', ')}`);

const internalLinks = [...html.matchAll(/\shref="#([^"]+)"/g)].map((match) => match[1]);
const missingAnchors = internalLinks.filter((target) => !ids.includes(target));
check(missingAnchors.length === 0, `Âncoras inexistentes: ${[...new Set(missingAnchors)].join(', ')}`);

const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
check(headings.filter((level) => level === 1).length === 1, 'A página deve conter exatamente um h1.');
for (let index = 1; index < headings.length; index += 1) {
  check(headings[index] <= headings[index - 1] + 1, `Salto na ordem de títulos na posição ${index + 1}.`);
}

const controls = [...html.matchAll(/<(input|textarea|select)\b[^>]*\sid="([^"]+)"[^>]*>/gi)];
for (const [, type, id] of controls) {
  check(new RegExp(`<label\\b[^>]*\\sfor="${id}"`, 'i').test(html), `${type}#${id} não possui label associado.`);
}

check(/<html\s+lang="pt-BR"/i.test(html), 'O idioma do documento deve ser pt-BR.');
check(/<meta\s+name="viewport"/i.test(html), 'A meta viewport não foi encontrada.');
check(/data-current-year/.test(html) && /new Date\(\)\.getFullYear\(\)/.test(javascript), 'O ano automático do rodapé não está configurado.');
check(/aria-controls="site-navigation"/.test(html) && /aria-expanded="false"/.test(html), 'O menu não expõe estado e controle acessíveis.');
check(/<details>[\s\S]*?<summary>/i.test(html), 'A FAQ não usa details/summary nativos.');
check(!/<form\b/i.test(html), 'Um formulário inesperado está presente.');
check(/whatsappNumber:\s*'5521964239334'/.test(javascript), 'O WhatsApp comercial não está configurado no formato internacional esperado.');
check(/Gostaria de conhecer a Pastoral 360 e solicitar uma demonstração/.test(javascript), 'A mensagem principal do WhatsApp foi alterada.');
check(/noopener noreferrer/.test(javascript), 'Links externos em nova aba não possuem proteção contra acesso à janela de origem.');
check(/data-floating-whatsapp(?![^>]*hidden)/.test(html), 'O botão flutuante do WhatsApp não está permanentemente visível.');
check(/floatingWhatsapp\.href = whatsappUrl\.href/.test(javascript), 'O botão flutuante não reutiliza o WhatsApp configurado.');
check(/data-whatsapp-primary/.test(html) && /primaryWhatsapp\.href = whatsappUrl\.href/.test(javascript), 'A chamada principal para o WhatsApp não foi configurada.');
check(/\.floating-whatsapp\s*\{[^}]*position:\s*fixed/s.test(css), 'O botão do WhatsApp não está fixo na página.');
check(/rel="icon"[^>]+pastoral360-favicon[^>]+type="image\/svg\+xml"/.test(html), 'O favicon SVG do Pastoral 360 não está configurado.');
check(/class="brand-mark"[^>]+icone-[^>]+\.png/.test(html), 'O ícone compilado não está aplicado ao cabeçalho.');
check(/class="footer-logo"[^>]+Logo1-[^>]+\.png/.test(html), 'A logomarca compilada não está aplicada ao rodapé.');
check(/\.brand-mark\s*\{[^}]*width:\s*auto[^}]*height:\s*2\.75rem/s.test(css), 'O ícone do cabeçalho pode estar com proporção forçada.');
check(/\.footer-logo\s*\{[^}]*height:\s*auto[^}]*object-fit:\s*contain/s.test(css), 'A logomarca do rodapé pode estar recortada ou deformada.');
check(/:focus-visible/.test(css), 'Não há estilo de foco visível.');
check(/prefers-reduced-motion:\s*reduce/.test(css), 'Não há tratamento para redução de movimento.');
check(/new IntersectionObserver/.test(javascript) && /revealObserver\.unobserve/.test(javascript), 'Os cards não são revelados progressivamente durante a rolagem.');
check(/html\.reveal-enabled \.reveal-card\.is-visible/.test(css), 'Os estados visuais da animação dos cards não foram encontrados.');
check(/@media \(max-width:\s*63\.9375rem\)/.test(css) && /@media \(max-width:\s*35rem\)/.test(css), 'Os breakpoints responsivos esperados não foram encontrados.');
check(/id="planos"/.test(html) && /href="#planos"/.test(html), 'A seção de planos não está disponível na navegação.');
check(/Por tempo limitado/.test(html) && /Experimente grátis por 30 dias/.test(html), 'O limite de 30 dias do período grátis não está explícito.');
check(['49,90', '79,90', '129,90', '199,90'].every((price) => html.includes(price)), 'Os preços não correspondem à especificação.');
check((html.match(/data-whatsapp-plan="[^"]+"/g) || []).length === 4, 'Todos os planos devem possuir uma chamada específica para o WhatsApp.');
check((html.match(/data-whatsapp-price="[^"]+"/g) || []).length === 4, 'Todos os planos devem informar o preço usado na mensagem do WhatsApp.');
check(/planWhatsappLinks\.forEach/.test(javascript) && /Tenho interesse no plano \$\{planName\} por \$\{planPrice\}/.test(javascript), 'A mensagem do WhatsApp não identifica plano e preço.');

if (failures.length) {
  console.error('Validação falhou:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  const origin = validateLocalBuild ? 'HTML Laravel renderizado e build local' : baseUrl.href;
  console.log(`Validação concluída em ${origin}: ${internalLinks.length} links internos, ${ids.length} IDs, ${controls.length} campos e ${uniqueAssetUrls.length} ativos locais verificados.`);
}

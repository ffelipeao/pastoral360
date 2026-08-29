import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const html = await readFile('index.html', 'utf8');
const css = await readFile('assets/css/styles.css', 'utf8');
const javascript = await readFile('assets/js/main.js', 'utf8');
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
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

const localAssets = [...html.matchAll(/\s(?:src|href)="((?!#|https?:|mailto:|tel:)[^"]+)"/g)]
  .map((match) => match[1])
  .filter((path) => !path.startsWith('data:'));
for (const path of localAssets) check(existsSync(path), `Ativo local não encontrado: ${path}`);

check(/<html\s+lang="pt-BR"/i.test(html), 'O idioma do documento deve ser pt-BR.');
check(/<meta\s+name="viewport"/i.test(html), 'A meta viewport não foi encontrada.');
check(/data-current-year/.test(html) && /new Date\(\)\.getFullYear\(\)/.test(javascript), 'O ano automático do rodapé não está configurado.');
check(/aria-controls="site-navigation"/.test(html) && /aria-expanded="false"/.test(html), 'O menu não expõe estado e controle acessíveis.');
check(/<details>[\s\S]*?<summary>/i.test(html), 'A FAQ não usa details/summary nativos.');
check(!/<form\b/i.test(html) && !existsSync('contact.php'), 'O formulário ou endpoint PHP ainda está presente.');
check(/whatsappNumber:\s*'5521964239334'/.test(javascript), 'O WhatsApp comercial não está configurado no formato internacional esperado.');
check(/Gostaria de conhecer a Pastoral 360 e solicitar uma demonstração/.test(javascript), 'A mensagem do WhatsApp não usa a concordância definida para a marca.');
check(/noopener noreferrer/.test(javascript), 'Links externos em nova aba não possuem proteção contra acesso à janela de origem.');
check(/data-floating-whatsapp(?![^>]*hidden)/.test(html), 'O botão flutuante do WhatsApp não está permanentemente visível.');
check(/floatingWhatsapp\.href = whatsappUrl\.href/.test(javascript), 'O botão flutuante não reutiliza o WhatsApp configurado.');
check(/data-whatsapp-primary/.test(html) && /primaryWhatsapp\.href = whatsappUrl\.href/.test(javascript), 'A chamada principal para o WhatsApp não foi configurada.');
check(/\.floating-whatsapp\s*\{[^}]*position:\s*fixed/s.test(css), 'O botão do WhatsApp não está fixo na página.');
check(existsSync('.htaccess'), 'A configuração de segurança da hospedagem não foi encontrada.');
check(/rel="icon" href="assets\/images\/pastoral360-favicon\.svg" type="image\/svg\+xml"/.test(html), 'O favicon SVG do Pastoral360 não está configurado.');
check(/class="brand-mark" src="assets\/images\/icone\.png"/.test(html), 'O novo ícone não está aplicado ao cabeçalho.');
check(/class="footer-logo" src="assets\/images\/Logo1\.png"/.test(html), 'A nova logomarca não está aplicada ao rodapé.');
check(/\.brand-mark\s*\{[^}]*width:\s*auto[^}]*height:\s*2\.75rem/s.test(css), 'O ícone do cabeçalho pode estar com proporção forçada.');
check(/\.footer-logo\s*\{[^}]*height:\s*auto[^}]*object-fit:\s*contain/s.test(css), 'A logomarca do rodapé pode estar recortada ou deformada.');
check(/:focus-visible/.test(css), 'Não há estilo de foco visível.');
check(/prefers-reduced-motion:\s*reduce/.test(css), 'Não há tratamento para redução de movimento.');
check(/new IntersectionObserver/.test(javascript) && /revealObserver\.unobserve/.test(javascript), 'Os cards não são revelados progressivamente durante a rolagem.');
check(/html\.reveal-enabled \.reveal-card\.is-visible/.test(css), 'Os estados visuais da animação dos cards não foram encontrados.');
check(/@media \(max-width: 63\.9375rem\)/.test(css) && /@media \(max-width: 35rem\)/.test(css), 'Os breakpoints responsivos esperados não foram encontrados.');
check(/id="planos"/.test(html) && /href="#planos"/.test(html), 'A seção de planos não está disponível na navegação.');
check(/Experimente grátis por 30 dias/.test(html) && /A gratuidade termina após 30 dias/.test(html), 'O limite de 30 dias do período grátis não está explícito.');
check(['49,90', '79,90', '129,90', '199,90'].every((price) => html.includes(price)), 'Os preços das modalidades comerciais não correspondem à especificação.');

if (failures.length) {
  console.error('Validação falhou:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Validação concluída: ${internalLinks.length} links internos, ${ids.length} IDs, ${controls.length} campos e ${localAssets.length} ativos locais verificados.`);
}

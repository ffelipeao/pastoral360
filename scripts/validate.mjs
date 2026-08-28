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
check(/action="contact\.php"/.test(html) && /method="post"/.test(html), 'O formulário não aponta para o endpoint PHP.');
check(/fetch\(contactForm\.action/.test(javascript), 'O envio assíncrono do formulário não está configurado.');
check(/name="website"/.test(html), 'O campo anti-spam do formulário não foi encontrado.');
check(/name="consentimento"/.test(html), 'O consentimento para contato não foi encontrado.');
check(/name="telefone"[^>]*type="tel"[^>]*required/.test(html), 'O telefone/WhatsApp obrigatório não está configurado.');
check(/name="email"[^>]*type="email"/.test(html) && !/name="email"[^>]*required/.test(html), 'O e-mail separado e opcional não está configurado.');
check(/post_value\('telefone'\)/.test(await readFile('contact.php', 'utf8')), 'O endpoint PHP não recebe o telefone separado.');
check(existsSync('contact.php'), 'O endpoint PHP de contato não foi encontrado.');
check(/const CONTACT_EMAIL = 'contato@pastoral360\.com\.br'/.test(await readFile('contact.php', 'utf8')), 'O destinatário principal do formulário está incorreto.');
check(/const CONTACT_COPY_EMAIL = 'feliperj629@gmail\.com'/.test(await readFile('contact.php', 'utf8')), 'O destinatário da cópia do formulário está incorreto.');
check(/'Cc: ' \. CONTACT_COPY_EMAIL/.test(await readFile('contact.php', 'utf8')), 'O cabeçalho de cópia não está configurado no envio PHP.');
check(/whatsappNumber:\s*'5521964239334'/.test(javascript), 'O WhatsApp comercial não está configurado no formato internacional esperado.');
check(/noopener noreferrer/.test(javascript), 'Links externos em nova aba não possuem proteção contra acesso à janela de origem.');
check(/data-floating-whatsapp/.test(html), 'O botão flutuante do WhatsApp não foi encontrado.');
check(/floatingWhatsapp\.href = whatsappUrl\.href/.test(javascript), 'O botão flutuante não reutiliza o WhatsApp configurado.');
check(/\.floating-whatsapp\s*\{[^}]*position:\s*fixed/s.test(css), 'O botão do WhatsApp não está fixo na página.');
check(existsSync('.htaccess'), 'A configuração de segurança da hospedagem não foi encontrada.');
check(/rel="icon" href="assets\/images\/pastoral360-favicon\.svg" type="image\/svg\+xml"/.test(html), 'O favicon SVG do Pastoral360 não está configurado.');
check(/class="brand-mark" src="assets\/images\/icone\.png"/.test(html), 'O novo ícone não está aplicado ao cabeçalho.');
check(/class="footer-logo" src="assets\/images\/Logo1\.png"/.test(html), 'A nova logomarca não está aplicada ao rodapé.');
check(/\.brand-mark\s*\{[^}]*width:\s*auto[^}]*height:\s*2\.75rem/s.test(css), 'O ícone do cabeçalho pode estar com proporção forçada.');
check(/\.footer-logo\s*\{[^}]*height:\s*auto[^}]*object-fit:\s*contain/s.test(css), 'A logomarca do rodapé pode estar recortada ou deformada.');
check(/:focus-visible/.test(css), 'Não há estilo de foco visível.');
check(/prefers-reduced-motion:\s*reduce/.test(css), 'Não há tratamento para redução de movimento.');
check(/@media \(max-width: 63\.9375rem\)/.test(css) && /@media \(max-width: 35rem\)/.test(css), 'Os breakpoints responsivos esperados não foram encontrados.');

if (failures.length) {
  console.error('Validação falhou:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Validação concluída: ${internalLinks.length} links internos, ${ids.length} IDs, ${controls.length} campos e ${localAssets.length} ativos locais verificados.`);
}

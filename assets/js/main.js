'use strict';

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-navigation');
const menuLabel = menuToggle?.querySelector('.menu-toggle-label');
const mobileMenuQuery = window.matchMedia('(max-width: 63.9375rem)');

// Preencha somente com contatos comerciais confirmados. Valores vazios não geram links.
const SITE_CONFIG = Object.freeze({
  siteUrl: '',
  socialImagePath: '',
  whatsappNumber: '5521964239334',
  whatsappMessage: 'Olá! Gostaria de conhecer o Portal Pastoral 360 e solicitar uma demonstração.',
  contactEmail: '',
});

function isPublicHttpUrl(value) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function appendMetadata(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement(attributes.rel ? 'link' : 'meta');
    document.head.append(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

if (isPublicHttpUrl(SITE_CONFIG.siteUrl)) {
  const canonicalUrl = new URL('/', SITE_CONFIG.siteUrl).href;
  appendMetadata('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
  appendMetadata('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });

  if (SITE_CONFIG.socialImagePath) {
    const socialImageUrl = new URL(SITE_CONFIG.socialImagePath, canonicalUrl).href;
    appendMetadata('meta[property="og:image"]', { property: 'og:image', content: socialImageUrl });
    appendMetadata('meta[property="og:image:alt"]', {
      property: 'og:image:alt',
      content: 'Portal Pastoral 360 — gestão integrada para igrejas',
    });
    appendMetadata('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    appendMetadata('meta[name="twitter:image"]', { name: 'twitter:image', content: socialImageUrl });
    appendMetadata('meta[name="twitter:image:alt"]', {
      name: 'twitter:image:alt',
      content: 'Portal Pastoral 360 — gestão integrada para igrejas',
    });
  }
}

function setMenuState(isOpen, { returnFocus = false } = {}) {
  if (!menuToggle || !navigation || !menuLabel) return;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuLabel.textContent = isOpen ? 'Fechar menu' : 'Abrir menu';
  navigation.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('menu-is-open', isOpen && mobileMenuQuery.matches);
  if (returnFocus) menuToggle.focus();
}

menuToggle?.addEventListener('click', () => setMenuState(menuToggle.getAttribute('aria-expanded') !== 'true'));
navigation?.addEventListener('click', (event) => { if (event.target.closest('a')) setMenuState(false); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') setMenuState(false, { returnFocus: true });
});
document.addEventListener('click', (event) => {
  if (menuToggle?.getAttribute('aria-expanded') === 'true' && !navigation?.contains(event.target) && !menuToggle.contains(event.target)) setMenuState(false);
});
mobileMenuQuery.addEventListener('change', (event) => { if (!event.matches) setMenuState(false); });

const currentYear = document.querySelector('[data-current-year]');
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

const whatsappNumber = SITE_CONFIG.whatsappNumber.replace(/\D/g, '');
const whatsappContainer = document.querySelector('[data-whatsapp-container]');
const footerContacts = document.querySelector('[data-footer-contacts]');
const contactFallback = document.querySelector('[data-contact-fallback]');
if (whatsappNumber && whatsappContainer) {
  const whatsappLink = document.createElement('a');
  whatsappLink.className = 'button button-secondary';
  const whatsappMessage = SITE_CONFIG.whatsappMessage.trim();
  const whatsappUrl = new URL(`https://wa.me/${whatsappNumber}`);
  if (whatsappMessage) whatsappUrl.searchParams.set('text', whatsappMessage);
  whatsappLink.href = whatsappUrl.href;
  whatsappLink.target = '_blank';
  whatsappLink.rel = 'noopener noreferrer';
  whatsappLink.textContent = 'Falar pelo WhatsApp';
  whatsappContainer.append(whatsappLink);
  whatsappContainer.hidden = false;
}

if (whatsappNumber && footerContacts) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = `https://wa.me/${whatsappNumber}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'WhatsApp: (21) 96423-9334';
  item.append(link);
  footerContacts.append(item);
  if (contactFallback) contactFallback.hidden = true;
}

if (SITE_CONFIG.contactEmail && footerContacts) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = `mailto:${SITE_CONFIG.contactEmail}`;
  link.textContent = SITE_CONFIG.contactEmail;
  item.append(link);
  footerContacts.append(item);
  if (contactFallback) contactFallback.hidden = true;
}

const contactForm = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');
const requiredFields = contactForm ? [...contactForm.querySelectorAll('[required]')] : [];

function showFieldValidity(field) {
  const error = document.querySelector(`#${field.id}-error`);
  const isValid = field.validity.valid;
  field.setAttribute('aria-invalid', String(!isValid));
  if (error) error.textContent = isValid ? '' : 'Preencha este campo obrigatório.';
  return isValid;
}

requiredFields.forEach((field) => {
  field.addEventListener('invalid', (event) => {
    event.preventDefault();
    showFieldValidity(field);
  });
  field.addEventListener('input', () => showFieldValidity(field));
  field.addEventListener('blur', () => showFieldValidity(field));
});

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const firstInvalidField = requiredFields.find((field) => !showFieldValidity(field));

  if (firstInvalidField) {
    if (formStatus) formStatus.textContent = 'Revise os campos indicados. O formulário não foi enviado.';
    firstInvalidField.focus();
    return;
  }

  if (formStatus) {
    formStatus.textContent = 'Seus dados permanecem no formulário. O envio está indisponível porque este formulário é apenas demonstrativo.';
  }
});

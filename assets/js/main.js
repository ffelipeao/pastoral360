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
  whatsappMessage: 'Olá! Gostaria de conhecer a Pastoral 360 e solicitar uma demonstração.',
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
      content: 'Pastoral 360 — gestão integrada para igrejas',
    });
    appendMetadata('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    appendMetadata('meta[name="twitter:image"]', { name: 'twitter:image', content: socialImageUrl });
    appendMetadata('meta[name="twitter:image:alt"]', {
      name: 'twitter:image:alt',
      content: 'Pastoral 360 — gestão integrada para igrejas',
    });
  }
}

const revealMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealCards = [...document.querySelectorAll([
  '.transformation-card',
  '.module-card',
  '.branch-card',
  '.profile-card',
  '.steps-list li',
  '.faq-list details',
].join(', '))];

if ('IntersectionObserver' in window && !revealMotionQuery.matches && revealCards.length) {
  revealCards.forEach((card, index) => {
    card.classList.add('reveal-card');
    card.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`);
  });

  document.documentElement.classList.add('reveal-enabled');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  revealCards.forEach((card) => revealObserver.observe(card));
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
const primaryWhatsapp = document.querySelector('[data-whatsapp-primary]');
const footerContacts = document.querySelector('[data-footer-contacts]');
const contactFallback = document.querySelector('[data-contact-fallback]');
const floatingWhatsapp = document.querySelector('[data-floating-whatsapp]');
const whatsappMessage = SITE_CONFIG.whatsappMessage.trim();
const whatsappUrl = whatsappNumber ? new URL(`https://wa.me/${whatsappNumber}`) : null;
if (whatsappUrl) {
  if (whatsappMessage) whatsappUrl.searchParams.set('text', whatsappMessage);
}

if (whatsappUrl && primaryWhatsapp) {
  primaryWhatsapp.href = whatsappUrl.href;
}

if (whatsappUrl && floatingWhatsapp) {
  floatingWhatsapp.href = whatsappUrl.href;
}

if (whatsappUrl && footerContacts) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = whatsappUrl.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'WhatsApp: (21) 96423-9334';
  item.append(link);
  footerContacts.append(item);
  if (contactFallback) contactFallback.hidden = true;
}

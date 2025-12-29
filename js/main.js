import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

import { initI18n, onLanguageChange, setLanguage } from './i18n.js';

gsap.registerPlugin(ScrollTrigger);

function setupLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  const hide = () => {
    gsap.to(loader, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.out',
      onComplete: () => {
        loader.style.display = 'none';
      }
    });
  };

  if (document.readyState === 'complete') {
    window.setTimeout(hide, 180);
  } else {
    window.addEventListener('load', () => window.setTimeout(hide, 180), { once: true });
  }
}

function setupActiveNav() {
  const links = Array.from(document.querySelectorAll('a.nav-link[href^="#"]'));
  if (links.length === 0) return;

  const sectionIds = links
    .map((l) => String(l.getAttribute('href') || ''))
    .filter((h) => h.startsWith('#') && h.length > 1)
    .map((h) => h.slice(1));

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const byId = new Map(links.map((l) => [String(l.getAttribute('href') || '').slice(1), l]));

  const setActive = (id) => {
    for (const link of links) {
      const isActive = String(link.getAttribute('href') || '').slice(1) === id;
      link.classList.toggle('is-active', isActive);
    }
  };

  if ('IntersectionObserver' in window && sections.length > 0) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
        if (visible.length === 0) return;
        const id = visible[0].target?.id;
        if (id && byId.has(id)) setActive(id);
      },
      { root: null, threshold: [0.18, 0.3, 0.45], rootMargin: '-20% 0px -65% 0px' }
    );

    for (const s of sections) io.observe(s);

    window.addEventListener(
      'hashchange',
      () => {
        const id = (location.hash || '').slice(1);
        if (id) setActive(id);
      },
      { passive: true }
    );

    const initial = (location.hash || '').slice(1) || 'home';
    setActive(initial);
    return;
  }

  const onScroll = () => {
    let activeId = 'home';
    let best = Number.POSITIVE_INFINITY;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top - 120);
      if (d < best) {
        best = d;
        activeId = s.id;
      }
    }
    setActive(activeId);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const show = () => {
    if (!btn.classList.contains('hidden')) return;
    btn.classList.remove('hidden');
    btn.classList.add('flex');
    gsap.fromTo(btn, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' });
  };

  const hide = () => {
    if (btn.classList.contains('hidden')) return;
    gsap.to(btn, {
      y: 10,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.out',
      onComplete: () => {
        btn.classList.add('hidden');
        btn.classList.remove('flex');
        btn.style.opacity = '';
        btn.style.transform = '';
      }
    });
  };

  const onScroll = () => {
    if (window.scrollY > 500) show();
    else hide();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function applyBrandAssets(dictionary) {
  const logo = document.getElementById('siteLogo');
  const footerLogo = document.getElementById('footerLogo');
  const loaderLogo = document.getElementById('loaderLogo');
  const favicon = document.getElementById('siteFavicon');

  const logoSrc = dictionary?.brand?.logoSrc;
  const faviconSrc = dictionary?.brand?.faviconSrc;

  if (logo && typeof logoSrc === 'string' && logoSrc.length > 0) logo.setAttribute('src', logoSrc);
  if (footerLogo && typeof logoSrc === 'string' && logoSrc.length > 0) footerLogo.setAttribute('src', logoSrc);
  if (loaderLogo && typeof logoSrc === 'string' && logoSrc.length > 0) loaderLogo.setAttribute('src', logoSrc);
  if (favicon && typeof faviconSrc === 'string' && faviconSrc.length > 0) favicon.setAttribute('href', faviconSrc);
}

function setupHeroSlider() {
  const slider = document.getElementById('heroSlider');
  const slidesHost = document.getElementById('heroSlides');
  const dotsHost = document.getElementById('heroDots');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');

  if (!slider || !slidesHost || !dotsHost || !prevBtn || !nextBtn) return () => {};

  const images = ['./img/Slider/492004038_10236469651261921_261716896888020327_n.jpg', './img/Slider/Slider1.jpg', './img/Slider/Slider2.jpg'];

  slidesHost.innerHTML = images
    .map(
      (src, idx) => `
        <div class="hero-slide absolute inset-0 ${idx === 0 ? '' : 'opacity-0'}">
          <img class="h-full w-full object-cover" src="${src}" alt="" loading="eager" decoding="async" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"></div>
        </div>
      `
    )
    .join('');

  dotsHost.innerHTML = images
    .map(
      (_, idx) =>
        `<button type="button" class="hero-dot h-2.5 w-2.5 rounded-full border border-black/10 ${idx === 0 ? 'bg-brand-500' : 'bg-white/70'}" aria-label="Go to slide ${idx + 1}" data-index="${idx}"></button>`
    )
    .join('');

  const slides = Array.from(slidesHost.querySelectorAll('.hero-slide'));
  const dots = Array.from(dotsHost.querySelectorAll('.hero-dot'));

  let index = 0;
  let timer = null;
  let animating = false;

  const setDot = (active) => {
    for (const d of dots) {
      const isActive = Number(d.getAttribute('data-index')) === active;
      d.classList.toggle('bg-brand-500', isActive);
      d.classList.toggle('bg-white/70', !isActive);
    }
  };

  const show = (nextIndex) => {
    if (animating) return;
    if (nextIndex === index) return;
    if (nextIndex < 0) nextIndex = slides.length - 1;
    if (nextIndex >= slides.length) nextIndex = 0;

    animating = true;
    const cur = slides[index];
    const next = slides[nextIndex];

    gsap.set(next, { opacity: 0, scale: 1.02 });
    gsap.to(cur, {
      opacity: 0,
      scale: 1.01,
      duration: 0.55,
      ease: 'power2.out'
    });
    gsap.to(next, {
      opacity: 1,
      scale: 1,
      duration: 0.65,
      ease: 'power2.out',
      onComplete: () => {
        index = nextIndex;
        setDot(index);
        animating = false;
      }
    });
  };

  const next = () => show(index + 1);
  const prev = () => show(index - 1);

  const start = () => {
    stop();
    timer = window.setInterval(next, 5500);
  };

  const stop = () => {
    if (timer != null) window.clearInterval(timer);
    timer = null;
  };

  nextBtn.addEventListener('click', () => {
    stop();
    next();
    start();
  });
  prevBtn.addEventListener('click', () => {
    stop();
    prev();
    start();
  });

  for (const dot of dots) {
    dot.addEventListener('click', () => {
      const to = Number(dot.getAttribute('data-index'));
      stop();
      show(to);
      start();
    });
  }

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);

  start();

  return () => stop();
}

function setActiveLanguageButton(lang) {
  const buttons = document.querySelectorAll('.lang-btn');
  if (!buttons || buttons.length === 0) return;

  for (const btn of buttons) {
    const active = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('bg-black/5', active);
    btn.classList.toggle('text-ink-900', active);
    btn.classList.toggle('text-ink-900/70', !active);
    btn.setAttribute('aria-pressed', String(active));
  }
}

function renderAboutList(dictionary) {
  const list = document.getElementById('aboutList');
  if (!list) return;

  const items = dictionary?.about?.list;
  if (!Array.isArray(items)) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = items
    .map(
      (text) => `
        <li class="flex gap-3 rounded-2xl border border-black/10 bg-white p-4 text-sm leading-relaxed text-ink-900 shadow-soft">
          <span class="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500/25 text-ink-950">✓</span>
          <span>${text}</span>
        </li>
      `
    )
    .join('');
}

function applyAboutVideo(dictionary) {
  const video = document.getElementById('aboutVideo');
  if (!video) return;
  const src = dictionary?.about?.videoSrc;
  if (typeof src === 'string' && src.length > 0) {
    if (video.getAttribute('src') !== src) video.setAttribute('src', src);
  }
}

function renderClientLogos(dictionary) {
  const host = document.getElementById('clientLogos');
  if (!host) return;

  const logos = (dictionary?.clients?.logos || []).filter((l) => {
    const src = String(l?.src || '').toLowerCase();
    const alt = String(l?.alt || '').toLowerCase();
    return !(src.includes('alhadhba') || alt.includes('alhadhba'));
  });
  if (!Array.isArray(logos)) {
    host.innerHTML = '';
    return;
  }

  host.innerHTML = logos
    .map(
      (l) => `
        <div class="reveal group relative flex items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-soft">
          <div class="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand-500/10 blur-xl"></div>
          <img class="relative z-10 max-h-10 w-auto opacity-90 transition duration-300 group-hover:opacity-100" src="${l.src}" alt="${l.alt || ''}" loading="lazy" decoding="async" />
        </div>
      `
    )
    .join('');
}

function renderServices(dictionary) {
  const container = document.getElementById('servicesGrid');
  if (!container) return;

  const items = dictionary?.services?.items;
  if (!Array.isArray(items)) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = items
    .map(
      (it) => `
        <article class="reveal group relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:border-black/20">
          <div class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/80 to-transparent opacity-70"></div>
          <div class="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(217,172,53,0.22),transparent_62%)] blur-2xl transition duration-300 group-hover:opacity-100"></div>
          <div class="pointer-events-none absolute -left-24 -bottom-24 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(7,11,18,0.06),transparent_60%)] blur-2xl"></div>

          <div class="relative z-10 flex items-start gap-4">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-700 transition duration-300 group-hover:bg-brand-500/25">
              ${getServiceIcon(it.title)}
            </div>
            <div class="flex flex-1 flex-col">
              <div class="flex items-start justify-between gap-4">
                <h3 class="text-lg font-semibold text-ink-900">${it.title ?? ''}</h3>
                <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/10 bg-white text-ink-900/60 opacity-0 transition duration-300 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M13.2 5.2 20 12l-6.8 6.8-1.4-1.4 4.4-4.4H4v-2h12.2l-4.4-4.4 1.4-1.4Z"/></svg>
                </span>
              </div>
              <p class="mt-2 flex-1 text-sm leading-relaxed text-ink-900/70">${it.description ?? ''}</p>
            </div>
          </div>
        </article>
      `
    )
    .join('');
}

function renderCompanies(dictionary) {
  const container = document.getElementById('companiesGrid');
  if (!container) return;

  const items = dictionary?.companies?.items;
  if (!Array.isArray(items)) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = items
    .map(
      (it) => `
        <article class="reveal group relative overflow-hidden rounded-[26px] border border-black/10 bg-white p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:border-black/20">
          <div class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/80 to-transparent opacity-70"></div>
          <div class="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(7,11,18,0.08),transparent_60%)] blur-2xl"></div>

          <div class="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold tracking-wide text-ink-900/50">${it.kicker ?? ''}</p>
              <h3 class="mt-1 text-lg font-semibold text-ink-900">${it.name ?? ''}</h3>
            </div>
            ${
              it.logo
                ? `<div class="group/logo flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-black/20">
                    <img class="h-9 w-auto opacity-90 transition duration-300 group-hover/logo:scale-[1.04] group-hover/logo:rotate-[1deg]" src="${it.logo}" alt="${it.name ?? ''}" loading="lazy" decoding="async" />
                  </div>`
                : ''
            }
          </div>

          <dl class="mt-5 grid gap-3 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="font-semibold text-ink-900/60">${it.revenueLabel ?? ''}</dt>
              <dd class="font-semibold text-ink-900">${it.revenue ?? ''}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="font-semibold text-ink-900/60">${it.employeesLabel ?? ''}</dt>
              <dd class="font-semibold text-ink-900">${it.employees ?? ''}</dd>
            </div>
            <div class="grid gap-1">
              <dt class="font-semibold text-ink-900/60">${it.clientsLabel ?? ''}</dt>
              <dd class="text-ink-900/75">${it.clients ?? ''}</dd>
            </div>
          </dl>

          ${
            it.url
              ? `<a class="mt-5 inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-ink-950 shadow-soft hover:brightness-95" href="${it.url}" target="_blank" rel="noreferrer">${it.cta ?? ''}</a>`
              : ''
          }
        </article>
      `
    )
    .join('');
}

function renderFounders(dictionary) {
  const container = document.getElementById('foundersGrid') || document.getElementById('teamGrid');
  if (!container) return;

  const members = dictionary?.team?.members;
  if (!Array.isArray(members)) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = members
  .map(
    (m) => `
      <article class="reveal group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:border-black/20">

        <!-- Gold hover glow -->
        <div class="pointer-events-none absolute inset-0 
          bg-[radial-gradient(ellipse_at_top,rgba(217,172,53,0.12),transparent_55%)]
          opacity-0 transition duration-300 group-hover:opacity-100">
        </div>

        <!-- Image -->
        <div class="aspect-[4/3] overflow-hidden bg-black/5">
          <img
            class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
            src="${m.image}"
            alt="${m.name}"
            loading="lazy"
            decoding="async"
          />
        </div>

        <!-- Text -->
        <div class="relative z-10 flex min-h-[88px] flex-1 flex-col justify-center p-5 text-center">
          <h3 class="text-base font-semibold text-ink-900">
            ${m.name}
          </h3>
          <p class="mt-1 text-xs font-semibold text-brand-700 uppercase tracking-wide">
            ${m.role}
          </p>
        </div>

      </article>
    `
  )
  .join("");
}

function setupMenu() {
  const btn = document.getElementById('menuBtn');
  const panel = document.getElementById('mobileNav');

  if (!btn || !panel) return;

  gsap.set(panel, { height: 0, opacity: 0, y: -6 });

  btn.addEventListener('click', () => {
    const isOpen = !panel.hasAttribute('hidden');

    if (isOpen) {
      btn.setAttribute('aria-expanded', 'false');
      gsap.set(panel, { height: panel.scrollHeight });
      gsap.to(panel, {
        height: 0,
        opacity: 0,
        y: -6,
        duration: 0.22,
        ease: 'power2.out',
        onComplete: () => {
          panel.setAttribute('hidden', '');
        }
      });
      return;
    }

    panel.removeAttribute('hidden');
    btn.setAttribute('aria-expanded', 'true');

    const contentHeight = panel.scrollHeight;
    gsap.fromTo(
      panel,
      { height: 0, opacity: 0, y: -6 },
      {
        height: contentHeight,
        opacity: 1,
        y: 0,
        duration: 0.26,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(panel, { height: 'auto' });
        }
      }
    );
  });
}

function setupSmoothAnchors() {
  const links = document.querySelectorAll('a.nav-link[href^="#"]');

  for (const link of links) {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.length < 2) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const mobileNav = document.getElementById('mobileNav');
      const menuBtn = document.getElementById('menuBtn');
      if (mobileNav && menuBtn && !mobileNav.hasAttribute('hidden')) {
        mobileNav.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

function setupLanguageSwitcher() {
  const select = document.getElementById('langSelect');
  const dropdown = document.getElementById('langDropdown');
  const btn = document.getElementById('langBtn');
  const btnLabel = document.getElementById('langBtnLabel');
  const menu = document.getElementById('langMenu');
  const options = Array.from(document.querySelectorAll('.lang-option'));

  const menuHome = {
    parent: menu?.parentElement || null,
    nextSibling: menu?.nextSibling || null
  };

  const restoreMenu = () => {
    if (!menu || !menuHome.parent) return;
    if (menu.parentElement === menuHome.parent) return;
    if (menuHome.nextSibling) menuHome.parent.insertBefore(menu, menuHome.nextSibling);
    else menuHome.parent.appendChild(menu);
    menu.style.position = '';
    menu.style.top = '';
    menu.style.left = '';
    menu.style.right = '';
    menu.style.marginTop = '';
    menu.style.width = '';
  };

  const positionMenu = () => {
    if (!btn || !menu) return;

    const rect = btn.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 176;
    const gap = 10;
    const left = Math.min(Math.max(gap, rect.right - menuWidth), window.innerWidth - menuWidth - gap);
    const top = rect.bottom + 8;

    menu.style.position = 'fixed';
    menu.style.top = `${Math.max(gap, top)}px`;
    menu.style.left = `${left}px`;
    menu.style.right = 'auto';
    menu.style.marginTop = '0';
    menu.style.width = `${menuWidth}px`;
  };

  const portalMenuToBody = () => {
    if (!menu) return;
    if (menu.parentElement !== document.body) document.body.appendChild(menu);
    positionMenu();
  };

  const setBtnLabel = (lang) => {
    if (btnLabel) btnLabel.textContent = String(lang || '').toUpperCase();
  };

  const closeMenu = () => {
    if (!btn || !menu) return;
    menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    restoreMenu();
  };

  const openMenu = () => {
    if (!btn || !menu) return;
    portalMenuToBody();
    menu.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    gsap.fromTo(menu, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: 'power2.out' });
  };

  if (select) {
    select.addEventListener('change', async () => {
      const lang = select.value;
      await setLanguage(lang);
    });
  }

  if (dropdown && btn && menu) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu();
      else openMenu();
    });

    for (const opt of options) {
      opt.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const lang = opt.getAttribute('data-lang');
        closeMenu();
        if (lang) await setLanguage(lang);
      });
    }

    document.addEventListener(
      'click',
      (e) => {
        const target = e.target;
        if (target instanceof Node) {
          if (btn.contains(target) || dropdown.contains(target) || (menu && menu.contains(target))) return;
        }
        closeMenu();
      },
      { capture: true }
    );

    window.addEventListener(
      'scroll',
      () => {
        if (btn.getAttribute('aria-expanded') === 'true') positionMenu();
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      if (btn.getAttribute('aria-expanded') === 'true') positionMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  onLanguageChange(({ lang }) => {
    setActiveLanguageButton(lang);
    if (select && select.value !== lang) select.value = lang;
    setBtnLabel(lang);
    closeMenu();
  });
}

function renderPartners(dictionary) {
  const host = document.getElementById('partnersGrid');
  if (!host) return;

  const logos = dictionary?.partners?.logos || [];
  if (!Array.isArray(logos)) {
    host.innerHTML = '';
    return;
  }

  const normalized = logos
    .filter((l) => l && typeof l.src === 'string' && l.src.length > 0)
    .map((l) => ({ src: l.src, alt: l.alt || '' }));

  if (normalized.length === 0) {
    host.innerHTML = '';
    return;
  }

  const loop = normalized.concat(normalized);

  host.innerHTML = `
    <div class="partners-marquee" aria-label="Nos clients carousel">
      <div class="partners-marquee__track">
        ${loop
          .map(
            (l) => `
              <div class="partners-marquee__item">
                <div class="group relative flex h-[112px] items-center justify-center overflow-hidden rounded-[26px] border border-black/10 bg-white/95 px-7 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_22px_60px_rgba(0,0,0,0.14)]">
                  <div class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/80 to-transparent opacity-60"></div>
                  <div class="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-500/10 blur-xl"></div>
                  <div class="pointer-events-none absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(7,11,18,0.06),transparent_60%)] blur-xl"></div>
                  <div class="relative z-10 flex h-16 w-full items-center justify-center">
                    <img class="h-16 max-w-[220px] object-contain opacity-85 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-[1.03]" src="${l.src}" alt="${l.alt}" loading="lazy" decoding="async" />
                  </div>
                </div>
              </div>
            `
          )
          .join('')}
      </div>
    </div>
  `;
}

function getServiceIcon(title) {
  const t = String(title || '').toLowerCase();
  if (t.includes('construct')) {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3 21V8l6-4 6 4v13H3Zm8-2h2v-3h-2v3ZM5 19h4v-3H5v3Zm0-5h4v-3H5v3Zm0-5h4V6.6L5 8.9V9Zm10 10h6V3h-7v2h5v14h-4v2Zm0-5h2v-3h-2v3Zm0-5h2V6h-2v3Z"/></svg>`;
  }
  if (t.includes('consult')) {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3 4h18v12H7l-4 4V4Zm2 2v9.17L6.17 14H19V6H5Zm4 1h6v2H9V7Zm0 4h10v2H9v-2Z"/></svg>`;
  }
  if (t.includes('logiciel') || t.includes('software')) {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M9 3h6v2h2a2 2 0 0 1 2 2v2h2v2h-2v2h2v2h-2v2a2 2 0 0 1-2 2h-2v2H9v-2H7a2 2 0 0 1-2-2v-2H3v-2h2v-2H3v-2h2V7a2 2 0 0 1 2-2h2V3Zm-2 4v10h10V7H7Z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M4 6h16v12H4V6Zm2 2v8h12V8H6Zm1 9h10v2H7v-2Z"/></svg>`;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function applyContactHrefs(dictionary) {
  const email = document.getElementById('contactEmail');
  const phone = document.getElementById('contactPhone');

  const emailHref = dictionary?.contact?.details?.emailHref;
  const phoneHref = dictionary?.contact?.details?.phoneHref;

  if (email && typeof emailHref === 'string') email.setAttribute('href', emailHref);
  if (phone && typeof phoneHref === 'string') phone.setAttribute('href', phoneHref);
}

function applyMap(dictionary) {
  const frame = document.getElementById('mapFrame');
  if (!frame) return;
  const src = dictionary?.contact?.mapEmbedUrl;
  if (typeof src === 'string' && src.length > 0) frame.setAttribute('src', src);
}

function applySocialLinks(dictionary) {
  const linkedIn = document.getElementById('socialLinkedIn');
  const facebook = document.getElementById('socialFacebook');
  const instagram = document.getElementById('socialInstagram');

  const s = dictionary?.footer?.social || {};
  if (linkedIn && typeof s.linkedinUrl === 'string') linkedIn.setAttribute('href', s.linkedinUrl);
  if (facebook && typeof s.facebookUrl === 'string') facebook.setAttribute('href', s.facebookUrl);
  if (instagram && typeof s.instagramUrl === 'string') instagram.setAttribute('href', s.instagramUrl);
}

function setupContactForm(getDictionary) {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const success = document.getElementById('formSuccess');

  const showError = (name, message) => {
    const el = document.getElementById(`error-${name}`);
    if (!el) return;
    el.textContent = message;
    el.hidden = !message;
  };

  const clearErrors = () => {
    for (const key of ['name', 'email', 'phone', 'subject', 'message']) showError(key, '');
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();
    if (success) success.hidden = true;

    const dictionary = getDictionary?.() || null;
    const validation = dictionary?.contact?.validation || {};

    const data = new FormData(form);

    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const subject = String(data.get('subject') || '').trim();
    const message = String(data.get('message') || '').trim();

    let ok = true;

    if (name.length < 2) {
      showError('name', String(validation.nameRequired || ''));
      ok = false;
    }

    if (!validateEmail(email)) {
      showError('email', String(validation.emailInvalid || ''));
      ok = false;
    }

    if (subject.length < 2) {
      showError('subject', String(validation.subjectRequired || ''));
      ok = false;
    }

    if (message.length < 10) {
      showError('message', String(validation.messageMin || ''));
      ok = false;
    }

    if (!ok) return;

    // Ready to connect: replace this with fetch() to your backend/email service.
    if (success) success.hidden = false;
    form.reset();
  });
}

function setupGsapAnimations() {
  const header = document.querySelector('header');
  if (header) {
    const headerItems = gsap.utils.toArray('#siteHeader [data-header-item]');
    if (headerItems.length > 0) {
      gsap.from(headerItems, { y: -10, opacity: 0, duration: 0.55, ease: 'power2.out', stagger: 0.06 });
    } else {
      gsap.from(header, { y: -10, opacity: 0, duration: 0.6, ease: 'power2.out' });
    }

    const blobs = gsap.utils.toArray('#siteHeader .header-blob');
    if (blobs.length > 0) {
      gsap.to(blobs, {
        y: (i) => (i % 2 === 0 ? 10 : -10),
        duration: 5.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }

    const shadowTween = gsap.to(header, {
      boxShadow: '0 16px 38px rgba(15, 23, 42, 0.10)',
      duration: 0.18,
      ease: 'power2.out',
      paused: true
    });

    const compactTween = gsap.to(header, {
      y: 10,
      duration: 0.18,
      ease: 'power2.out',
      paused: true,
      onStart: () => header.classList.add('is-scrolled')
    });

    ScrollTrigger.create({
      start: 'top -10',
      onEnter: () => {
        shadowTween.play();
        compactTween.play();
      },
      onLeaveBack: () => {
        shadowTween.reverse();
        compactTween.reverse();
        header.classList.remove('is-scrolled');
      }
    });
  }

  const kicker = document.querySelector('#home [data-i18n="hero.kicker"]');
  const title = document.querySelector('#home h1');
  const subtitle = document.querySelector('#home [data-i18n="hero.subtitle"]');
  const ctas = gsap.utils.toArray('#home a');
  const stats = gsap.utils.toArray('#home dl > div');

  if (kicker) gsap.from(kicker, { y: 10, opacity: 0, duration: 0.55, delay: 0.05, ease: 'power3.out' });
  if (title) gsap.from(title, { y: 18, opacity: 0, duration: 0.75, delay: 0.1, ease: 'power3.out' });
  if (subtitle) gsap.from(subtitle, { y: 14, opacity: 0, duration: 0.65, delay: 0.18, ease: 'power3.out' });
  if (ctas.length > 0) gsap.from(ctas, { y: 10, opacity: 0, duration: 0.55, delay: 0.25, stagger: 0.06, ease: 'power2.out' });
  if (stats.length > 0) gsap.from(stats, { y: 10, opacity: 0, duration: 0.55, delay: 0.32, stagger: 0.08, ease: 'power2.out' });

  ScrollTrigger.batch('.reveal', {
    start: 'top 82%',
    onEnter: (batch) => {
      gsap.from(batch, {
        y: 18,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08
      });
    }
  });

  const headings = gsap.utils.toArray('main section h2');
  for (const h of headings) {
    gsap.from(h, {
      scrollTrigger: { trigger: h, start: 'top 85%' },
      y: 14,
      opacity: 0,
      duration: 0.55,
      ease: 'power2.out'
    });
  }
}

async function bootstrap() {
  setupLoader();
  setupBackToTop();
  setupMenu();
  setupSmoothAnchors();
  setupLanguageSwitcher();
  setupActiveNav();

  setupHeroSlider();

  const dictionary = await initI18n();
  const dictionaryState = { dictionary };

  const safe = (label, fn) => {
    try {
      fn();
    } catch (err) {
      console.error(`[Beehive] ${label} failed`, err);
    }
  };

  safe('applyBrandAssets', () => applyBrandAssets(dictionary));
  safe('applyContactHrefs', () => applyContactHrefs(dictionary));
  safe('applyMap', () => applyMap(dictionary));
  safe('applySocialLinks', () => applySocialLinks(dictionary));
  safe('applyAboutVideo', () => applyAboutVideo(dictionary));
  safe('setupContactForm', () => setupContactForm(() => dictionaryState.dictionary));
  safe('renderAboutList', () => renderAboutList(dictionary));
  safe('renderClientLogos', () => renderClientLogos(dictionary));
  safe('renderPartners', () => renderPartners(dictionary));
  safe('renderServices', () => renderServices(dictionary));
  safe('renderCompanies', () => renderCompanies(dictionary));
  safe('renderFounders', () => renderFounders(dictionary));

  onLanguageChange(({ dictionary: nextDictionary }) => {
    dictionaryState.dictionary = nextDictionary;
    safe('applyBrandAssets', () => applyBrandAssets(nextDictionary));
    safe('applyContactHrefs', () => applyContactHrefs(nextDictionary));
    safe('applyMap', () => applyMap(nextDictionary));
    safe('applySocialLinks', () => applySocialLinks(nextDictionary));
    safe('applyAboutVideo', () => applyAboutVideo(nextDictionary));
    safe('renderAboutList', () => renderAboutList(nextDictionary));
    safe('renderClientLogos', () => renderClientLogos(nextDictionary));
    safe('renderPartners', () => renderPartners(nextDictionary));
    safe('renderServices', () => renderServices(nextDictionary));
    safe('renderCompanies', () => renderCompanies(nextDictionary));
    safe('renderFounders', () => renderFounders(nextDictionary));
  });

  safe('setupGsapAnimations', () => setupGsapAnimations());
}

bootstrap().catch((err) => console.error('[Beehive] bootstrap failed', err));

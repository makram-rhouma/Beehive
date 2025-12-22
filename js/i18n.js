const SUPPORTED_LANGS = ['en', 'fr', 'ar'];

const STORAGE_KEY = 'beehive_lang';

const state = {
  lang: 'fr',
  dictionary: null,
  cache: new Map()
};

function getByPath(obj, path) {
  const parts = path.split('.');
  let cur = obj;

  for (const part of parts) {
    if (cur == null) return undefined;
    cur = cur[part];
  }

  return cur;
}

function isSupported(lang) {
  return SUPPORTED_LANGS.includes(lang);
}

function normalizeLang(lang) {
  const l = String(lang || '').toLowerCase();
  return isSupported(l) ? l : 'fr';
}

function pathLangFromUrl() {
  const parts = window.location.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
  const last = parts[parts.length - 1];

  if (isSupported(last)) return normalizeLang(last);

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeLang(stored);
  } catch {
  }

  return 'fr';
}

function setUrlLang(lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
  }

  const parts = window.location.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  if (!isSupported(last)) return;

  const baseParts = parts.slice(0, -1);
  const next = `/${baseParts.join('/')}${baseParts.length ? '/' : ''}`;

  try {
    if (window.location.pathname !== next) {
      window.history.replaceState({}, '', next);
    }
  } catch {
  }
}

async function loadDictionary(lang) {
  if (state.cache.has(lang)) return state.cache.get(lang);

  const res = await fetch(`./data/${lang}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load language file: ${lang}`);

  const json = await res.json();
  state.cache.set(lang, json);
  return json;
}

function applyTextTranslations(dictionary) {
  const nodes = document.querySelectorAll('[data-i18n]');

  for (const el of nodes) {
    const key = el.getAttribute('data-i18n');
    const value = getByPath(dictionary, key);

    if (typeof value === 'string') {
      el.textContent = value;
    }
  }

  const contentNodes = document.querySelectorAll('[data-i18n-content]');
  for (const el of contentNodes) {
    const key = el.getAttribute('data-i18n-content');
    const value = getByPath(dictionary, key);

    if (typeof value === 'string') {
      el.setAttribute('content', value);
    }
  }

  const placeholderNodes = document.querySelectorAll('[data-i18n-placeholder]');
  for (const el of placeholderNodes) {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = getByPath(dictionary, key);

    if (typeof value === 'string') {
      el.setAttribute('placeholder', value);
    }
  }
}

function setDocumentDirection(lang) {
  const isRtl = lang === 'ar';
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
}

const listeners = new Set();
function notify(lang, dictionary) {
  for (const fn of listeners) fn({ lang, dictionary });
}

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLanguage() {
  return state.lang;
}

export async function setLanguage(nextLang) {
  const lang = normalizeLang(nextLang);

  state.lang = lang;
  setDocumentDirection(lang);
  setUrlLang(lang);

  state.dictionary = await loadDictionary(lang);
  applyTextTranslations(state.dictionary);
  notify(lang, state.dictionary);

  return state.dictionary;
}

export async function initI18n() {
  const initial = pathLangFromUrl();
  return setLanguage(initial);
}

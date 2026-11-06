// Combines language dictionaries. Shared base lives in en.js / hi.js.
// Per-module strings live in ./modules/<module>.js (each: export default { en:{...}, hi:{...} })
// and are auto-merged below, so modules can be translated independently without touching shared files.
// Usage:  const t = useT();  t('nav.sales')   // or  t('some.key', 'Fallback text')
import en from './en';
import hi from './hi';

const mergedEn = { ...en };
const mergedHi = { ...hi };

// Vite eager glob: pulls in every module dictionary at build time.
const mods = import.meta.glob('./modules/*.js', { eager: true });
for (const mod of Object.values(mods)) {
  const d = mod.default || {};
  Object.assign(mergedEn, d.en || {});
  Object.assign(mergedHi, d.hi || {});
}

export const translations = { en: mergedEn, hi: mergedHi };

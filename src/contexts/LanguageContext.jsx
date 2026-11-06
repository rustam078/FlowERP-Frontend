import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

const LANG_KEY = 'skr_language';
export const DEFAULT_LANG = 'en';
export const LANGUAGES = [
  { code: 'en', labelKey: 'settings.language.english' },
  { code: 'hi', labelKey: 'settings.language.hindi' },
];

const LanguageContext = createContext(null);

const read = () => {
  try { return localStorage.getItem(LANG_KEY) || DEFAULT_LANG; } catch { return DEFAULT_LANG; }
};

/**
 * Holds the selected UI language on this device and exposes t() for static-text translation.
 * English is the default; unknown/missing Hindi keys fall back to English, then to the key.
 */
export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(read);

  const setLanguage = useCallback((lang) => {
    const l = translations[lang] ? lang : DEFAULT_LANG;
    setLanguageState(l);
    try {
      if (l === DEFAULT_LANG) localStorage.removeItem(LANG_KEY);
      else localStorage.setItem(LANG_KEY, l);
      document.documentElement.lang = l;
    } catch { /* storage unavailable — keep in-memory */ }
  }, []);

  // Translate a flat dot-key; optional fallback text when the key is not defined anywhere.
  const t = useCallback((key, fallback) => {
    const dict = translations[language] || translations.en;
    return dict[key] ?? translations.en[key] ?? fallback ?? key;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// Full access (language + setter + t). Safe defaults if used outside the provider.
export const useLanguage = () =>
  useContext(LanguageContext) || { language: DEFAULT_LANG, setLanguage: () => {}, t: (k, f) => f ?? k };

// Shorthand when a component only needs the translator.
export const useT = () => useLanguage().t;

import React, { createContext, useContext, useEffect, useState } from 'react';

import hrTranslations from './hr.json';
import enTranslations from './en.json';

export const LANG_KEY = 'appLang';

const defaultLang = 'hr';
const supportedLanguages = ['hr', 'en'];

const translations = {
  hr: hrTranslations,
  en: enTranslations,
};

function normalizeLang(lang) {
  if (supportedLanguages.includes(lang)) return lang;
  return defaultLang;
}

function getInitialLang() {
  const stored = sessionStorage.getItem(LANG_KEY);

  if (stored && supportedLanguages.includes(stored)) {
    return stored;
  }

  sessionStorage.setItem(LANG_KEY, defaultLang);
  return defaultLang;
}

const LanguageContext = createContext({
  lang: defaultLang,
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }) => {

  const [lang, setLangState] = useState(getInitialLang);

  const setLanguage = (newLang) => {
    const normalized = normalizeLang(newLang);
    sessionStorage.setItem(LANG_KEY, normalized);
    setLangState(normalized);
  };

  useEffect(() => {

    const handler = (e) => {
      if (e.key === LANG_KEY && e.newValue) {
        const normalized = normalizeLang(e.newValue);
        setLangState(normalized);
      }
    };

    window.addEventListener('storage', handler);

    return () => window.removeEventListener('storage', handler);

  }, []);

  const t = (key) => {
    return translations[lang]?.[key] || translations[defaultLang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  return useContext(LanguageContext);
};
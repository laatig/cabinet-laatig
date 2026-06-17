import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface LanguageContextType {
  lang: string;
  setLang: (l: string) => void;
  t: (key: string) => string;
  dir: string;
}

const STORAGE_KEY = 'cabinet_laatig_lang';

const staticTranslations: Record<string, Record<string, string>> = {
  fr: {
    'nav.dashboard': 'Tableau de Bord',
  },
  ar: {
    'nav.dashboard': 'لوحة القيادة',
  },
};

function lookup(key: string, lang: string): string {
  const dict = staticTranslations[lang];
  if (dict && dict[key]) return dict[key];
  return key;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'fr');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: string) => setLangState(l), []);

  const t = useCallback((key: string) => lookup(key, lang), [lang]);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

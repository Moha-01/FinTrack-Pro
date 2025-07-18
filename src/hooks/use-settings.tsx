
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import deTranslations from '@/locales/de.json';
import enTranslations from '@/locales/en.json';

type Language = 'en' | 'de';
type Currency = 'EUR' | 'USD' | 'GBP';

interface SettingsContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  formatCurrency: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<Language, any> = {
  en: enTranslations,
  de: deTranslations,
};

const getInitialState = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return fallback;
    }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => getInitialState('fintrack_language', 'en'));
  const [currency, setCurrencyState] = useState<Currency>(() => getInitialState('fintrack_currency', 'EUR'));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const browserLang = navigator.language.split('-')[0];
    const storedLang = localStorage.getItem('fintrack_language');
    if (!storedLang && (browserLang === 'de' || browserLang === 'en')) {
      setLanguageState(browserLang as Language);
    }
  }, []);

  useEffect(() => {
    if(isMounted) {
        localStorage.setItem('fintrack_language', language);
        document.documentElement.lang = language;
    }
  }, [language, isMounted]);

  useEffect(() => {
    if(isMounted) {
        localStorage.setItem('fintrack_currency', currency);
    }
  }, [currency, isMounted]);
  
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };
  
  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
  };

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if key not found in current language
        let fallbackResult = translations['en'];
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
        }
        result = fallbackResult || key;
        break;
      }
    }
    
    if (typeof result === 'string' && replacements) {
        for(const [placeholder, value] of Object.entries(replacements)) {
            result = result.replace(`{{${placeholder}}}`, String(value));
        }
    }
    
    return result || key;
  }, [language]);

  const formatCurrency = useMemo(() => {
    const locales: Record<Currency, string> = {
      EUR: 'de-DE',
      USD: 'en-US',
      GBP: 'en-GB',
    };
    return (amount: number) => new Intl.NumberFormat(locales[currency], {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, [currency]);
  
  const value = { language, setLanguage, currency, setCurrency, t, formatCurrency };

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};


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
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string | null) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  formatCurrency: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<Language, any> = {
  en: enTranslations,
  de: deTranslations,
};

// A simple utility to get values from localStorage, with a fallback.
const getInitialState = <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') {
        return fallback;
    }
    const item = window.localStorage.getItem(key);
    try {
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        // If parsing fails, it might be a plain string.
        return item as T ?? fallback;
    }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => getInitialState('fintrack_language', 'de'));
  const [currency, setCurrency] = useState<Currency>(() => getInitialState('fintrack_currency', 'EUR'));
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() => getInitialState('fintrack_geminiApiKey', null));

  // Effect to set initial language based on browser preference if not already set.
  useEffect(() => {
    const storedLang = localStorage.getItem('fintrack_language');
    if (!storedLang) {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'de' || browserLang === 'en') {
        setLanguage(browserLang as Language);
      }
    }
  }, []);

  // Effects to update localStorage whenever a setting changes.
  useEffect(() => {
    localStorage.setItem('fintrack_language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('fintrack_currency', JSON.stringify(currency));
  }, [currency]);

  useEffect(() => {
    if (geminiApiKey) {
      localStorage.setItem('fintrack_geminiApiKey', geminiApiKey);
    } else {
      localStorage.removeItem('fintrack_geminiApiKey');
    }
  }, [geminiApiKey]);
  
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
        result = fallbackResult || key; // Return the key itself if not found anywhere
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
  
  const value = { language, setLanguage, currency, setCurrency, geminiApiKey, setGeminiApiKey, t, formatCurrency };

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

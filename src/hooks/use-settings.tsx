"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  activeProfile: string;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  formatCurrency: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<Language, any> = {
  en: enTranslations,
  de: deTranslations,
};

const getInitialState = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return fallback;
    // For simple string values that aren't JSON encoded
    if (key.includes('language') || key.includes('currency') || key.includes('geminiApiKey') || key.includes('activeProfile')) {
        return item as T;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
};


export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, _setLanguage] = useState<Language>(() => getInitialState('fintrack_language', 'de'));
  const [currency, _setCurrency] = useState<Currency>(() => getInitialState('fintrack_currency', 'EUR'));
  const [geminiApiKey, _setGeminiApiKey] = useState<string | null>(() => getInitialState('fintrack_geminiApiKey', null));
  const [activeProfile, setActiveProfile] = useState<string>(() => getInitialState('fintrack_activeProfile', ''));

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const handleStorageChange = () => {
            setActiveProfile(getInitialState('fintrack_activeProfile', ''));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    _setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fintrack_language', lang);
    }
  }, []);
  
  const setCurrency = useCallback((curr: Currency) => {
    _setCurrency(curr);
     if (typeof window !== 'undefined') {
      localStorage.setItem('fintrack_currency', curr);
    }
  }, []);

  const setGeminiApiKey = useCallback((key: string | null) => {
      _setGeminiApiKey(key);
      if (typeof window !== 'undefined') {
        if (key) {
          localStorage.setItem('fintrack_geminiApiKey', key);
        } else {
          localStorage.removeItem('fintrack_geminiApiKey');
        }
      }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  
  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
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

  const formatCurrency = useCallback((amount: number) => {
    const locales: Record<Currency, string> = {
      EUR: 'de-DE',
      USD: 'en-US',
      GBP: 'en-GB',
    };
    return new Intl.NumberFormat(locales[currency], {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, [currency]);
  
  const value = { language, setLanguage, currency, setCurrency, geminiApiKey, setGeminiApiKey, t, formatCurrency, activeProfile };
  
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

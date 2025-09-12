import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../i18n/translations';

type Language = 'en' | 'ru' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string, variables: Record<string, string | number> = {}): string => {
    const keys = key.split('.');
    let text = translations[language];
    try {
      for (const k of keys) {
        text = text[k];
      }

      if (typeof text !== 'string') {
        // Fallback to English if translation not found
        let fallbackText = translations['en'];
        for (const k of keys) {
            fallbackText = fallbackText[k];
        }
        if (typeof fallbackText === 'string') {
            text = fallbackText;
        } else {
            return key; // Return key if no translation is found anywhere
        }
      }

    } catch (e) {
      return key; // Return key if path is invalid
    }
    

    // Replace variables
    Object.keys(variables).forEach(varKey => {
      const regex = new RegExp(`{{${varKey}}}`, 'g');
      text = text.replace(regex, String(variables[varKey]));
    });

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

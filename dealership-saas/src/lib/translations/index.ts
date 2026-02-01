import enTranslations from './en.json';
import urTranslations from './ur.json';
import type { Language } from '../store/language-store';

export type TranslationKey = 
    | `common.${keyof typeof enTranslations.common}`
    | `dashboard.${keyof typeof enTranslations.dashboard}`
    | `clients.${keyof typeof enTranslations.clients}`
    | `todayBook.${keyof typeof enTranslations.todayBook}`;

const translations = {
    en: enTranslations,
    ur: urTranslations,
} as const;

export function getTranslation(language: Language, key: TranslationKey, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
        value = value?.[k];
    }
    
    if (typeof value !== 'string') {
        // Fallback to English if translation not found
        let fallback: any = translations.en;
        for (const k of keys) {
            fallback = fallback?.[k];
        }
        value = fallback || key;
    }
    
    // Replace parameters
    if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
            value = value.replace(`{${paramKey}}`, String(paramValue));
        });
    }
    
    return value;
}

export { translations };

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ur';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    isRTL: boolean;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'en',
            isRTL: false,
            setLanguage: (lang: Language) => {
                const newIsRTL: boolean = lang === 'ur';
                set({ 
                    language: lang,
                    isRTL: newIsRTL
                });
                // Update HTML dir attribute
                if (typeof document !== 'undefined') {
                    document.documentElement.setAttribute('dir', newIsRTL ? 'rtl' : 'ltr');
                    document.documentElement.setAttribute('lang', lang);
                }
            },
        }),
        {
            name: 'language-storage',
            onRehydrateStorage: () => (state) => {
                // Update HTML after rehydration
                if (state && typeof document !== 'undefined') {
                    const isRTL = state.language === 'ur';
                    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
                    document.documentElement.setAttribute('lang', state.language);
                }
            },
        }
    )
);

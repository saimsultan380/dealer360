'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/lib/store/language-store';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const { language, setLanguage } = useLanguageStore();

    useEffect(() => {
        // Initialize language on mount
        if (typeof document !== 'undefined') {
            const isRTL = language === 'ur';
            document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
            document.documentElement.setAttribute('lang', language);
        }
    }, [language, setLanguage]);

    return <>{children}</>;
}

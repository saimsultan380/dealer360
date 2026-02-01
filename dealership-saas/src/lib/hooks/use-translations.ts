import { useLanguageStore } from '../store/language-store';
import { getTranslation, type TranslationKey } from '../translations';

export function useTranslations() {
    const language = useLanguageStore((state) => state.language);
    
    const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
        return getTranslation(language, key, params);
    };
    
    return { t, language };
}

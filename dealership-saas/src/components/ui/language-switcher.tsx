'use client';

import { Languages, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguageStore, type Language } from '@/lib/store/language-store';
import { cn } from '@/lib/utils';

const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
];

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguageStore();

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
    };

    const currentLanguage = languages.find((l) => l.code === language) || languages[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 relative"
                    title="Change Language"
                >
                    <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="absolute -top-1 -right-1 text-xs">{currentLanguage.flag}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={cn(
                            "flex items-center justify-between cursor-pointer",
                            language === lang.code && "bg-accent"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{lang.flag}</span>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">{lang.name}</span>
                                <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
                            </div>
                        </div>
                        {language === lang.code && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

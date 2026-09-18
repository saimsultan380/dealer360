'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [spinning, setSpinning] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  const toggleTheme = () => {
    setSpinning(true);
    setTheme(isDark ? 'light' : 'dark');
    window.setTimeout(() => setSpinning(false), 400);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative h-9 w-9 overflow-hidden sm:h-10 sm:w-10"
    >
      <Sun
        className={cn(
          'h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ease-out',
          isDark
            ? 'rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100',
          spinning && !isDark && 'animate-[spin_0.35s_ease-out]'
        )}
      />
      <Moon
        className={cn(
          'absolute h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ease-out',
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0',
          spinning && isDark && 'animate-[spin_0.35s_ease-out]'
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

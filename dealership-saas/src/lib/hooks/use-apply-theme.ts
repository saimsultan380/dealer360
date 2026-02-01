'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store/theme-store';

/**
 * Hook to apply theme colors to the DOM on component mount
 * Ensures CSS custom properties are set correctly
 */
export function useApplyTheme() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);
}

function applyThemeToDOM(theme: any) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  
  // Apply CSS custom properties for colors
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-destructive', theme.colors.destructive);
  root.style.setProperty('--color-muted', theme.colors.muted);
  
  // Apply specific component colors
  root.style.setProperty('--sidebar-active-color', theme.sidebarActiveColor);
  root.style.setProperty('--button-active-color', theme.buttonActiveColor);
  root.style.setProperty('--tabs-active-color', theme.tabsActiveColor);

  // Apply Tailwind CSS classes dynamically
  // Update primary button colors
  updateButtonColors();
}

function updateButtonColors() {
  const root = document.documentElement;
  const primaryColor = root.style.getPropertyValue('--color-primary');
  
  if (primaryColor) {
    // Update any elements using the primary color
    const primaryButtons = document.querySelectorAll('[data-theme-primary]');
    primaryButtons.forEach((button) => {
      (button as HTMLElement).style.backgroundColor = primaryColor;
    });

    // Update sidebar active items
    const sidebarItems = document.querySelectorAll('[data-sidebar-item]');
    sidebarItems.forEach((item) => {
      if (item.classList.contains('active')) {
        (item as HTMLElement).style.backgroundColor = primaryColor;
      }
    });
  }
}

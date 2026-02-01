import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  destructive: string;
  muted: string;
}

export interface ComponentStyles {
  buttons: boolean;
  tabs: boolean;
  sidebar: boolean;
  links: boolean;
  destructive: boolean;
}

export interface ThemeCustomization {
  colors: ThemeColors;
  componentStyles: ComponentStyles;
}

const DEFAULT_COLORS: ThemeColors = {
  primary: '#3b82f6', // blue
  secondary: '#6366f1', // indigo
  accent: '#06b6d4', // cyan
  destructive: '#ef4444', // red
  muted: '#9ca3af', // gray
};

const DEFAULT_COMPONENT_STYLES: ComponentStyles = {
  buttons: true,
  tabs: true,
  sidebar: true,
  links: false,
  destructive: true,
};

const DEFAULT_THEME: ThemeCustomization = {
  colors: DEFAULT_COLORS,
  componentStyles: DEFAULT_COMPONENT_STYLES,
};

interface ThemeStore {
  theme: ThemeCustomization;
  setTheme: (theme: ThemeCustomization) => void;
  updateColors: (colors: Partial<ThemeColors>) => void;
  updateComponentStyles: (styles: Partial<ComponentStyles>) => void;
  resetTheme: () => void;
  addCustomColor: (name: string, value: string) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      
      setTheme: (theme: ThemeCustomization) => {
        set({ theme });
      },
      
      updateColors: (colors: Partial<ThemeColors>) => {
        set((state) => ({
          theme: {
            ...state.theme,
            colors: { ...state.theme.colors, ...colors },
          },
        }));
      },
      
      updateComponentStyles: (styles: Partial<ComponentStyles>) => {
        set((state) => ({
          theme: {
            ...state.theme,
            componentStyles: { ...state.theme.componentStyles, ...styles },
          },
        }));
      },
      
      resetTheme: () => {
        set({ theme: DEFAULT_THEME });
      },

      addCustomColor: (name: string, value: string) => {
        set((state) => ({
          theme: {
            ...state.theme,
            colors: {
              ...state.theme.colors,
              [name]: value,
            } as ThemeColors,
          },
        }));
      },
    }),
    {
      name: 'theme-store',
      version: 2,
    }
  )
);

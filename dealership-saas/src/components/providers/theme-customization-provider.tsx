"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store/theme-store";

export function ThemeCustomizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const applyTheme = () => {
      if (typeof window === "undefined") return;

      let styleElement = document.getElementById(
        "theme-customization-styles"
      ) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = "theme-customization-styles";
        document.head.appendChild(styleElement);
      }

      let css = "";

      // Apply colors ONLY to selected components
      if (theme.componentStyles.buttons) {
        css += `
          button[class*="bg-primary"],
          a[class*="bg-primary"],
          [role="button"][class*="bg-primary"] {
            background-color: ${theme.colors.primary} !important;
          }
          button.btn-secondary {
            background-color: ${theme.colors.secondary} !important;
          }
          button[class*="destructive"],
          button[variant="destructive"] {
            background-color: ${theme.colors.destructive} !important;
          }
        `;
      }

      if (theme.componentStyles.tabs) {
        css += `
          [role="tab"][aria-selected="true"] {
            border-color: ${theme.colors.primary} !important;
            color: ${theme.colors.primary} !important;
          }
        `;
      }

      if (theme.componentStyles.sidebar) {
        css += `
          [data-sidebar-item].active,
          .sidebar [data-state="active"],
          nav a[data-active="true"],
          .sidebar-nav a[aria-current="page"] {
            background-color: ${theme.colors.primary} !important;
            color: white !important;
          }
        `;
      }

      if (theme.componentStyles.links) {
        css += `
          a:not([class*="button"]):not([class*="btn"]) {
            color: ${theme.colors.primary} !important;
          }
        `;
      }

      if (theme.componentStyles.destructive) {
        css += `
          button.destructive,
          [data-destructive="true"] {
            background-color: ${theme.colors.destructive} !important;
          }
        `;
      }

      styleElement.innerHTML = css;
    };

    applyTheme();
  }, [theme]);

  return <>{children}</>;
}

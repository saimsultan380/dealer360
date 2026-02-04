"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Palette, Monitor, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ThemeCustomization } from "./theme-customization";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="space-y-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 shrink-0 relative top-px" />
            <span>Theme Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose how the application looks to you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:gap-3 grid-cols-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 border rounded-lg transition-all ${
                theme === "light"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Sun className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="text-center min-h-8">
                <Label className="font-semibold text-xs sm:text-sm block">
                  Light
                </Label>
                <p className="text-xs text-muted-foreground">Light mode</p>
              </div>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 border rounded-lg transition-all ${
                theme === "dark"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Moon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="text-center min-h-8">
                <Label className="font-semibold text-xs sm:text-sm block">
                  Dark
                </Label>
                <p className="text-xs text-muted-foreground">Dark mode</p>
              </div>
            </button>

            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3 border rounded-lg transition-all ${
                theme === "system"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Monitor className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="text-center min-h-8">
                <Label className="font-semibold text-xs sm:text-sm block">
                  System
                </Label>
                <p className="text-xs text-muted-foreground">Follow system</p>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="space-y-0.5">
                <Label className="text-sm sm:text-base">Quick Toggle</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Toggle between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </CardContent>
      </Card>

      <ThemeCustomization />
    </div>
  );
}

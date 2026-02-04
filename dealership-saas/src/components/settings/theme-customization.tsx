"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  RotateCcw,
  Copy,
  Check,
  Palette,
  MousePointer2,
  LayoutPanelLeft,
  PanelTop,
  Link2,
  AlertTriangle,
} from "lucide-react";
import { useThemeStore } from "@/lib/store/theme-store";

const COLOR_PRESETS = [
  {
    name: "Blue",
    colors: { primary: "#3b82f6", secondary: "#60a5fa", accent: "#06b6d4" },
    icon: "🔵",
  },
  {
    name: "Purple",
    colors: { primary: "#a855f7", secondary: "#c084fc", accent: "#ec4899" },
    icon: "🟣",
  },
  {
    name: "Green",
    colors: { primary: "#10b981", secondary: "#34d399", accent: "#06b6d4" },
    icon: "🟢",
  },
  {
    name: "Orange",
    colors: { primary: "#f97316", secondary: "#fb923c", accent: "#fbbf24" },
    icon: "🟠",
  },
  {
    name: "Red",
    colors: { primary: "#ef4444", secondary: "#f87171", accent: "#fca5a5" },
    icon: "🔴",
  },
  {
    name: "Teal",
    colors: { primary: "#06b6d4", secondary: "#22d3ee", accent: "#14b8a6" },
    icon: "🔷",
  },
  {
    name: "White",
    colors: { primary: "#ffffff", secondary: "#f3f4f6", accent: "#e5e7eb" },
    icon: "⚪",
  },
];

interface ColorInputProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, description, value, onChange }: ColorInputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2 p-3 rounded-lg border bg-muted/50 hover:bg-muted/80 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <Label className="text-sm font-semibold">{label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 w-8 p-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-16 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm bg-background font-mono"
          placeholder="#3b82f6"
        />
      </div>
    </div>
  );
}

interface ComponentToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ReactNode;
}

function ComponentToggle({
  label,
  description,
  checked,
  onCheckedChange,
  icon,
}: ComponentToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/50 mt-0.5">
          {icon}
        </div>
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold cursor-pointer">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function ThemeCustomization() {
  const [mounted, setMounted] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const updateColors = useThemeStore((state) => state.updateColors);
  const updateComponentStyles = useThemeStore(
    (state) => state.updateComponentStyles
  );
  const resetTheme = useThemeStore((state) => state.resetTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-lg bg-muted animate-pulse"></div>
        <div className="h-32 rounded-lg bg-muted animate-pulse"></div>
      </div>
    );
  }

  const applyPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    updateColors(preset.colors);
  };

  return (
    <div className="space-y-6">
      {/* Color Palettes */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Color Palettes</CardTitle>
              <CardDescription className="mt-1">
                Choose a beautiful pre-designed palette or customize your own
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:border-primary hover:shadow-md ${
                  theme.colors.primary === preset.colors.primary
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex gap-1.5">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                    style={{ backgroundColor: preset.colors.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                    style={{ backgroundColor: preset.colors.secondary }}
                  />
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                    style={{ backgroundColor: preset.colors.accent }}
                  />
                </div>
                <p className="text-sm font-semibold text-center">
                  {preset.name}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customize Palette */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-4">
          <div>
            <CardTitle>Customize Color Palette</CardTitle>
            <CardDescription className="mt-1">
              Fine-tune individual colors to match your brand
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ColorInput
            label="Primary Color"
            description="Buttons, links, and main highlights"
            value={theme.colors.primary}
            onChange={(color) => updateColors({ primary: color })}
          />
          <ColorInput
            label="Secondary Color"
            description="Secondary actions and accents"
            value={theme.colors.secondary}
            onChange={(color) => updateColors({ secondary: color })}
          />
          <ColorInput
            label="Accent Color"
            description="Tertiary accents and focus states"
            value={theme.colors.accent}
            onChange={(color) => updateColors({ accent: color })}
          />
          <ColorInput
            label="Destructive Color"
            description="Delete, warning, and error actions"
            value={theme.colors.destructive}
            onChange={(color) => updateColors({ destructive: color })}
          />
          <ColorInput
            label="Muted Color"
            description="Disabled elements and placeholders"
            value={theme.colors.muted}
            onChange={(color) => updateColors({ muted: color })}
          />
        </CardContent>
      </Card>

      {/* Apply Styling Options */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-4">
          <div>
            <CardTitle>Apply Styling To Components</CardTitle>
            <CardDescription className="mt-1">
              Choose which UI elements get your custom colors
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ComponentToggle
            icon={<MousePointer2 className="h-5 w-5 text-muted-foreground" />}
            label="Buttons"
            description="Primary, secondary, and destructive buttons"
            checked={theme.componentStyles.buttons}
            onCheckedChange={(checked) =>
              updateComponentStyles({ buttons: checked })
            }
          />

          <ComponentToggle
            icon={<PanelTop className="h-5 w-5 text-muted-foreground" />}
            label="Tabs & Navigation"
            description="Active tab indicators and tab borders"
            checked={theme.componentStyles.tabs}
            onCheckedChange={(checked) =>
              updateComponentStyles({ tabs: checked })
            }
          />

          <ComponentToggle
            icon={<LayoutPanelLeft className="h-5 w-5 text-muted-foreground" />}
            label="Sidebar Navigation"
            description="Active menu items and navigation highlights"
            checked={theme.componentStyles.sidebar}
            onCheckedChange={(checked) =>
              updateComponentStyles({ sidebar: checked })
            }
          />

          <ComponentToggle
            icon={<Link2 className="h-5 w-5 text-muted-foreground" />}
            label="Text Links"
            description="Color for regular hyperlinks"
            checked={theme.componentStyles.links}
            onCheckedChange={(checked) =>
              updateComponentStyles({ links: checked })
            }
          />

          <ComponentToggle
            icon={<AlertTriangle className="h-5 w-5 text-muted-foreground" />}
            label="Destructive Actions"
            description="Delete buttons and warning messages"
            checked={theme.componentStyles.destructive}
            onCheckedChange={(checked) =>
              updateComponentStyles({ destructive: checked })
            }
          />
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="border shadow-sm bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Live Preview</CardTitle>
          <CardDescription className="mt-0.5">
            See how your customizations look in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {theme.componentStyles.buttons && (
              <>
                <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Primary
                  </p>
                  <button
                    type="button"
                    style={{ backgroundColor: theme.colors.primary }}
                    className="w-full min-w-0 max-w-[180px] rounded-[4px] h-9 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    Primary Button
                  </button>
                </div>
                <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Secondary
                  </p>
                  <button
                    type="button"
                    style={{ backgroundColor: theme.colors.secondary }}
                    className="w-full min-w-0 max-w-[180px] rounded-[4px] h-9 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    Secondary
                  </button>
                </div>
              </>
            )}
            {theme.componentStyles.destructive && (
              <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Delete
                </p>
                <button
                  type="button"
                  style={{ backgroundColor: theme.colors.destructive }}
                  className="w-full min-w-0 max-w-[180px] rounded-[4px] h-9 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            )}
            {theme.componentStyles.sidebar && (
              <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sidebar
                </p>
                <div
                  style={{ backgroundColor: theme.colors.primary }}
                  className="w-full min-w-0 max-w-[180px] rounded-[4px] h-9 flex items-center justify-center text-sm font-medium text-white shadow-sm"
                >
                  Active Menu
                </div>
              </div>
            )}
            {theme.componentStyles.tabs && (
              <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tab
                </p>
                <div
                  className="inline-flex h-9 items-center justify-center border-b-2 px-3 text-sm font-medium min-w-0 max-w-[180px]"
                  style={{
                    borderColor: theme.colors.primary,
                    color: theme.colors.primary,
                  }}
                >
                  Active Tab
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Changes are automatically saved
        </p>
        <Button variant="outline" onClick={resetTheme} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

import type { FeatureFlags } from "@/lib/types/database";

export type FeatureFlagBooleanKey = {
  [K in keyof FeatureFlags]-?: FeatureFlags[K] extends boolean | undefined
    ? K
    : never;
}[keyof FeatureFlags];

export function isFeatureEnabled(
  flags: Partial<FeatureFlags> | null | undefined,
  key: FeatureFlagBooleanKey,
  defaultEnabled = true
): boolean {
  const value = flags?.[key];
  return typeof value === "boolean" ? value : defaultEnabled;
}

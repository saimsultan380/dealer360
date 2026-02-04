/**
 * Resolve client or investor avatar URL for display.
 * Handles both full URLs (from Supabase Storage getPublicUrl) and storage paths.
 * Use everywhere we display client/investor avatars so images show consistently.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const STORAGE_BUCKET = "vehicles";

export function getClientAvatarUrl(
  avatarUrl: string | null | undefined
): string | undefined {
  if (!avatarUrl?.trim()) return undefined;
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }
  if (!SUPABASE_URL) return avatarUrl;
  const path = avatarUrl.startsWith("/") ? avatarUrl.slice(1) : avatarUrl;
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export function getInvestorAvatarUrl(
  avatarUrl: string | null | undefined
): string | undefined {
  return getClientAvatarUrl(avatarUrl);
}

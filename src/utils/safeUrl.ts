/**
 * Validates that a dynamically supplied external href uses only http(s) schemes.
 * Returns undefined for javascript:, data:, vbscript:, file:, or malformed URLs
 * so React omits the href attribute instead of rendering an executable URI.
 */
export function toSafeExternalHref(rawUrl: string | null | undefined): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

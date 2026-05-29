/**
 * Public site origin for FCM / Web Push (must be absolute URLs).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://www.example.com).
 */
export function getPublicSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`.replace(/\/$/, "");
  }
  return "https://www.shrisawariyamart.com".replace(/\/$/, "");
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  const base = getPublicSiteUrl();
  const p = (pathOrUrl || "/").trim() || "/";
  if (/^https?:\/\//i.test(p)) return p;
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${base}${path}`;
}

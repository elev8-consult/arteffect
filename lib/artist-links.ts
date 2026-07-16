export function normalizeExternalUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function normalizeInstagramUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  let handle = trimmed.replace(/^@/, "");

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(url.hostname.toLowerCase())) {
        return undefined;
      }
      handle = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      return undefined;
    }
  }

  if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) return undefined;
  return `https://www.instagram.com/${handle}/`;
}

export function parseGallery(raw?: string | string[] | null): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return String(raw)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function stringifyGallery(urls: string[]): string {
  return JSON.stringify(urls.filter(Boolean));
}

export function projectPhotos(project: { image?: string | null; gallery?: string | string[] | null }): string[] {
  const extras = parseGallery(project.gallery);
  return Array.from(new Set([project.image || "", ...extras].filter(Boolean)));
}

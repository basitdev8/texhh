const ALLOWED_REMOTE_IMAGE_HOSTS = new Set([
  'res.cloudinary.com',
  'images.unsplash.com',
  'cdn.pixabay.com',
]);

export function isAllowedImageSource(src?: string): src is string {
  if (!src) return false;
  if (src.startsWith('/')) return true;

  try {
    const url = new URL(src);
    return url.protocol === 'https:' && ALLOWED_REMOTE_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://techchasers.in').replace(/\/$/, '');

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

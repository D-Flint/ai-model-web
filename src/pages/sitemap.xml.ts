import type { APIRoute } from 'astro';
import { models } from '../data/models';
import { categories } from '../data/config';
export const GET: APIRoute = ({ site }) => {
  // No fictional or invented deployment domain is emitted in local mode.
  const paths = [
    '/',
    '/models',
    '/compare',
    '/rankings',
    '/find',
    '/cost',
    '/methodology',
    ...models.map((m) => `/models/${m.slug}`),
    ...categories.map((c) => `/rankings/${c.slug}`),
  ];
  const escape = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site ? paths.map((path) => `<url><loc>${escape(new URL(path, site).href)}</loc></url>`).join('') : ''}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};

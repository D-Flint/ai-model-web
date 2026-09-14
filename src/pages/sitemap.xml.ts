import type { APIRoute } from 'astro';
import { models } from '../data/models';
import { categories } from '../data/config';
import { getSeoComparisonPairs } from '../lib/seoComparisons';
import { getPublishedRankingModels } from '../lib/rankings';
export const GET: APIRoute = ({ site }) => {
  // No fictional or invented deployment domain is emitted in local mode.
  const seoPairs = getSeoComparisonPairs(models);
  const rankingAsOf = new Date().toISOString().slice(0, 10);
  const publishedModels = [
    ...new Map(
      [...models, ...getPublishedRankingModels(models, rankingAsOf)].map(
        (model) => [model.slug, model],
      ),
    ).values(),
  ];
  const paths = [
    '/',
    '/models',
    '/pricing',
    '/compare',
    '/rankings',
    '/find',
    '/cost',
    '/methodology',
    ...publishedModels.map((m) => `/models/${m.slug}`),
    ...categories.map((c) => `/rankings/${c.slug}`),
    ...seoPairs.map((p) => `/compare/${p.slug}`),
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

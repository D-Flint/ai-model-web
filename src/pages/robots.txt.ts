import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const isIndexingEnabled = import.meta.env.ENABLE_INDEXING === 'true';
  const lines = ['User-agent: *'];

  if (!isIndexingEnabled || !site) {
    lines.push('Disallow: /');
  } else {
    lines.push('Allow: /', `Sitemap: ${new URL('/sitemap.xml', site).href}`);
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

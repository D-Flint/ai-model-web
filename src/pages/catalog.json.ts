import type { APIRoute } from 'astro';
import { publishedModels } from '../data/models';

// Shared static catalog for pair-page selectors; avoids embedding it in every pair.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(publishedModels), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

import type { APIRoute } from 'astro';
import { models } from '../data/models';

// Shared static catalog for pair-page selectors; avoids embedding it in every pair.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(models), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

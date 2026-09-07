import { mkdir, writeFile } from 'node:fs/promises';
import { models } from '../src/data/models';

// These public deployment artifacts contain the same reviewed data as catalog.json.
// Keep validation and catalog-wide transformations outside the Worker runtime.
await mkdir('public/_comparison-data', { recursive: true });
await mkdir('src/data/generated', { recursive: true });
await Promise.all(
  models.map((model) =>
    writeFile(
      `public/_comparison-data/${model.slug}.json`,
      JSON.stringify(model),
    ),
  ),
);
await writeFile(
  'src/data/generated/comparisonSlugs.json',
  JSON.stringify(
    models.map((model) => model.slug),
    null,
    2,
  ) + '\n',
);
console.log(`Prepared ${models.length} comparison records; no pair pages.`);

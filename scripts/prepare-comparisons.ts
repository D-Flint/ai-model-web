import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { publishedModels } from '../src/data/models';

// These public deployment artifacts contain the same reviewed data as catalog.json.
// Keep validation and catalog-wide transformations outside the Worker runtime.
await mkdir('public/_comparison-data', { recursive: true });
await mkdir('src/data/generated', { recursive: true });
const publishedSlugs = new Set(publishedModels.map((model) => model.slug));
const existingArtifacts = await readdir('public/_comparison-data', {
  withFileTypes: true,
});
await Promise.all(
  existingArtifacts
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        !publishedSlugs.has(entry.name.slice(0, -'.json'.length)),
    )
    .map((entry) =>
      rm(`public/_comparison-data/${entry.name}`, { force: true }),
    ),
);
await Promise.all(
  publishedModels.map((model) =>
    writeFile(
      `public/_comparison-data/${model.slug}.json`,
      JSON.stringify(model),
    ),
  ),
);
await writeFile(
  'src/data/generated/comparisonSlugs.json',
  JSON.stringify(
    publishedModels.map((model) => model.slug),
    null,
    2,
  ) + '\n',
);
console.log(
  `Prepared ${publishedModels.length} comparison records; no pair pages.`,
);

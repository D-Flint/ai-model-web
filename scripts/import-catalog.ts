import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { validateCatalog } from '../src/lib/importCatalog';
const input = process.argv[2];
if (!input)
  throw new Error('Usage: npm run data:import -- path/to/catalog.json');
const catalog = validateCatalog(
  JSON.parse(await readFile(resolve(input), 'utf8')),
);
const serialized = JSON.stringify(catalog, null, 2) + '\n';
const hash = createHash('sha256').update(serialized).digest('hex').slice(0, 16);
const directory = resolve('src/data/history');
await mkdir(directory, { recursive: true });
const path = resolve(
  directory,
  `${new Date().toISOString().replace(/[:.]/g, '-')}-${hash}.json`,
);
await writeFile(path, serialized, { flag: 'wx' });
console.log(
  `Validated ${catalog.length} models. Archived snapshot: ${path}. Publication requires source review; the active fixture catalog was not changed.`,
);

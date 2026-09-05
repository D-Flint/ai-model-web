import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateCatalog } from '../src/lib/importCatalog';
import { connectDatabase } from '../src/db/client';
import { catalogSnapshots } from '../src/db/schema/evidence';
const input = process.argv[2];
if (!input)
  throw new Error(
    'Usage: npm run data:persist -- path/to/reviewed-catalog.json',
  );
const catalog = validateCatalog(JSON.parse(await readFile(input, 'utf8')));
const serialized = JSON.stringify(catalog);
const hash = createHash('sha256').update(serialized).digest('hex');
const kinds = new Set(catalog.map((m) => m.dataKind));
const connection = connectDatabase();
try {
  await connection.db
    .insert(catalogSnapshots)
    .values({
      id: crypto.randomUUID(),
      sha256: hash,
      dataKind: kinds.size === 1 ? catalog[0].dataKind : 'mixed',
      catalog,
    })
    .onConflictDoNothing();
  console.log('Validated snapshot persisted without overwriting history.');
} finally {
  await connection.close();
}

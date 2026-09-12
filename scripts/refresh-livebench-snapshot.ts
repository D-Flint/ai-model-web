import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { liveBenchRowSchema, type LiveBenchRow } from '../src/pipeline/types';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';

const releaseDate = '2026-06-25';
const tableUrl = `https://raw.githubusercontent.com/LiveBench/new-livebench/main/public/table_${releaseDate.replaceAll('-', '_')}.csv`;
const categoriesUrl = `https://raw.githubusercontent.com/LiveBench/new-livebench/main/public/categories_${releaseDate.replaceAll('-', '_')}.json`;
const costUrl = `https://livebench.ai/cost_${releaseDate.replaceAll('-', '_')}.csv`;

type TableRow = {
  model: string;
  scores: Map<string, number>;
};

type CostRow = {
  model: string;
  costPerSuccessfulTask: number;
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else {
      cell += character;
    }
  }

  cells.push(cell);
  return cells;
}

function parseTable(csv: string): TableRow[] {
  const lines = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0] ?? '');
  const modelIndex = headers.indexOf('model');
  if (modelIndex < 0) throw new Error('LiveBench CSV has no model column');

  return lines.slice(1).flatMap((line) => {
    if (!line.trim()) return [];
    const cells = parseCsvLine(line);
    const model = cells[modelIndex]?.trim();
    if (!model) return [];

    const scores = new Map<string, number>();
    headers.forEach((header, index) => {
      const value = Number(cells[index]);
      if (header !== 'model' && Number.isFinite(value))
        scores.set(header, value);
    });
    return [{ model, scores }];
  });
}

function parseCost(csv: string): CostRow[] {
  const lines = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0] ?? '');
  const modelIndex = headers.indexOf('model');
  const costIndex = headers.indexOf('cost_per_successful_task');
  if (modelIndex < 0 || costIndex < 0)
    throw new Error('LiveBench cost CSV is missing required columns');

  return lines.slice(1).flatMap((line) => {
    if (!line.trim()) return [];
    const cells = parseCsvLine(line);
    const model = cells[modelIndex]?.trim();
    const cost = Number(cells[costIndex]);
    return model && Number.isFinite(cost) && cost >= 0
      ? [{ model, costPerSuccessfulTask: cost }]
      : [];
  });
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return Number(
    (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1),
  );
}

function categoryScore(
  row: TableRow,
  subcategories: string[] | undefined,
): number | undefined {
  if (!subcategories) return undefined;
  return average(
    subcategories.flatMap((subcategory) => {
      const value = row.scores.get(subcategory);
      return value === undefined ? [] : [value];
    }),
  );
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { Accept: 'text/plain', 'User-Agent': 'Astra-Model-Guide/1.0' },
  });
  if (!response.ok)
    throw new Error(`LiveBench fetch failed: HTTP ${response.status}`);
  return response.text();
}

async function main() {
  const [csv, categoriesJson, costCsv] = await Promise.all([
    fetchText(tableUrl),
    fetchText(categoriesUrl),
    fetchText(costUrl),
  ]);
  const categories = JSON.parse(categoriesJson) as Record<string, string[]>;
  const rows = parseTable(csv);
  const costByModel = new Map(
    parseCost(costCsv).map((row) => [row.model, row.costPerSuccessfulTask]),
  );

  const refreshedRows = rows.map((row): LiveBenchRow => {
    const scores = {
      reasoning: categoryScore(row, categories.Reasoning),
      coding: categoryScore(row, categories.Coding),
      agentic_coding: categoryScore(row, categories['Agentic Coding']),
      math: categoryScore(row, categories.Mathematics),
      data_analysis: categoryScore(row, categories['Data Analysis']),
      language: categoryScore(row, categories.Language),
      instruction_following: categoryScore(row, categories.IF),
    };
    const availableScores = Object.values(scores).filter(
      (value): value is number => value !== undefined,
    );
    const globalAverage = average(availableScores);
    if (globalAverage === undefined)
      throw new Error(`No scores for ${row.model}`);

    return liveBenchRowSchema.parse({
      model: row.model,
      global_average: globalAverage,
      ...scores,
      cost_per_successful_task: costByModel.get(row.model),
      date: releaseDate,
    });
  });

  const snapshotPath = resolve('src/data/livebenchData.json');
  const existing = JSON.parse(
    await readFile(snapshotPath, 'utf8'),
  ) as LiveBenchRow[];
  const refreshedSlugs = new Set(
    refreshedRows.flatMap((row) => {
      const canonical = defaultAliasResolver.resolve('livebench', row.model);
      return canonical ? [canonical.slug] : [];
    }),
  );
  const refreshedModels = new Set(refreshedRows.map((row) => row.model));
  const merged = [
    ...existing.filter((row) => {
      const canonical = defaultAliasResolver.resolve('livebench', row.model);
      return (
        !refreshedModels.has(row.model) &&
        (!canonical || !refreshedSlugs.has(canonical.slug))
      );
    }),
    ...refreshedRows,
  ];
  await writeFile(snapshotPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log(
    `Saved ${refreshedRows.length} official rows; snapshot now has ${merged.length} rows.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

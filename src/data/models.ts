import verifiedCatalogRaw from './verifiedModels.json';
import { validateCatalog } from '../lib/importCatalog';
import { composite, normalize } from '../lib/decision';
import { fixtureDate, methodologyVersion, type Capability } from './config';
import type { CatalogModel } from '../lib/catalogSchema';

// Fictional providers and model names for fallback fixtures
const seeds = [
  [
    'quill-pro',
    'Quill Pro',
    'Quill Labs',
    'Thoughtful answers for complex work.',
    [94, 96, 92, 90, 93, 95, 88, 69, 92, 65],
    3,
    15,
    200000,
    'Coding,Writing,Research',
    'Slower responses;Higher output cost',
  ],
  [
    'orbit-ultra',
    'Orbit Ultra',
    'Orbit AI',
    'A versatile partner with room for long documents.',
    [95, 90, 88, 93, 94, 90, 96, 74, 89, 72],
    2,
    10,
    1000000,
    'Research,Vision,Daily use',
    'Cost grows with long documents;Less consistent tool workflows',
  ],
  [
    'nova-reason',
    'Nova Reason',
    'Nova Labs',
    'Deliberate reasoning for demanding problems.',
    [97, 94, 95, 85, 96, 84, 85, 51, 91, 51],
    5,
    20,
    256000,
    'Agents,Coding,Research',
    'Longer wait for answers;Premium API pricing',
  ],
  [
    'quill-air',
    'Quill Air',
    'Quill Labs',
    'A fast, approachable everyday assistant.',
    [82, 83, 79, 92, 78, 89, 80, 95, 88, 93],
    0.3,
    1.5,
    200000,
    'Daily use,Writing,Best value',
    'Less depth on difficult research;Smaller output limit',
  ],
  [
    'orbit-flash',
    'Orbit Flash',
    'Orbit AI',
    'Quick answers with a generous context window.',
    [85, 85, 80, 91, 85, 82, 90, 97, 85, 96],
    0.15,
    0.6,
    1000000,
    'Best value,Vision,Daily use',
    'Needs checking on complex work;Less nuanced writing',
  ],
  [
    'cedar-code',
    'Cedar Code',
    'Cedar Research',
    'A focused assistant for practical software work.',
    [88, 95, 93, 77, 79, 73, 0, 81, 87, 88],
    0.6,
    2.4,
    128000,
    'Coding,Agents,Open weights',
    'No image input;Less natural everyday writing',
  ],
  [
    'nova-mini',
    'Nova Mini',
    'Nova Labs',
    'Balanced capability for everyday tasks.',
    [86, 87, 86, 90, 83, 84, 84, 90, 90, 91],
    0.4,
    1.6,
    128000,
    'Daily use,Best value,Coding',
    'Less depth than larger models;Limited long-document room',
  ],
  [
    'cedar-chat',
    'Cedar Chat',
    'Cedar Research',
    'Flexible text assistance with open weights.',
    [80, 79, 74, 88, 76, 85, 0, 91, 82, 94],
    0.2,
    0.8,
    128000,
    'Daily use,Open weights,Best value',
    'No image input;Self-hosting costs vary',
  ],
  [
    'tide-large',
    'Tide Large',
    'Tide Systems',
    'Reliable tools and structured responses.',
    [89, 91, 94, 84, 85, 80, 82, 80, 95, 78],
    1.5,
    6,
    256000,
    'Agents,Coding,Research',
    'Less expressive writing;Mid-range API costs',
  ],
  [
    'tide-small',
    'Tide Small',
    'Tide Systems',
    'A compact model for repeatable workflows.',
    [76, 80, 82, 83, 72, 78, 71, 96, 89, 97],
    0.1,
    0.4,
    64000,
    'Best value,Agents,Daily use',
    'Smaller context window;Needs guidance on complex tasks',
  ],
  [
    'prism-vision',
    'Prism Vision',
    'Prism AI',
    'Image understanding for visually rich work.',
    [88, 80, 78, 87, 89, 84, 98, 77, 86, 75],
    1.2,
    5,
    512000,
    'Vision,Research,Daily use',
    'Limited coding depth;Image token usage varies',
  ],
  [
    'prism-write',
    'Prism Write',
    'Prism AI',
    'A clear voice for drafting and editing.',
    [85, 74, 70, 91, 84, 97, 76, 85, 88, 84],
    0.8,
    3.2,
    128000,
    'Writing,Daily use,Research',
    'Not built for coding agents;Moderate output costs',
  ],
] as const;

const keys: Capability[] = [
  'intelligence',
  'coding',
  'agentic',
  'dailyUse',
  'research',
  'writing',
  'vision',
  'speed',
  'reliability',
  'costEfficiency',
];

export const mockModels: CatalogModel[] = validateCatalog(
  seeds.map((seed, index) => {
    const [
      slug,
      name,
      provider,
      description,
      values,
      input,
      output,
      context,
      tags,
      weaknesses,
    ] = seed;
    const scores = Object.fromEntries(
      keys.map((key, i) => [key, normalize(values[i] * 10, 0, 1000)]),
    ) as Record<Capability, number>;
    return {
      slug,
      name,
      provider,
      family: name.split(' ')[0],
      dataKind: 'mock',
      description,
      strengths: tags
        .split(',')
        .map((tag) => `Designed in this sample to favor ${tag.toLowerCase()}.`),
      weaknesses: weaknesses.split(';'),
      tags: tags.split(','),
      facts: {
        context,
        maxOutput: index % 3 === 0 ? 32000 : 16000,
        speedTokensPerSec: Math.round(scores.speed * 1.8),
        vision: scores.vision > 0,
        audio: provider === 'Orbit AI',
        tools: true,
        structured: true,
        api: true,
        openWeights: provider === 'Cedar Research',
        easeOfUse: scores.dailyUse,
        availability: 'Sample API',
        releaseDate: fixtureDate,
        sourceId: 'sample-catalog',
      },
      pricing: {
        input,
        output,
        cached: input / 4,
        currency: 'USD',
        unit: 'per-million-tokens',
        sourceId: 'sample-catalog',
        updatedAt: fixtureDate,
      },
      scores: { ...scores, overall: composite(scores) },
      evidence: keys.map((metric, i) => ({
        metric,
        kind: 'mock',
        raw: values[i] * 10,
        min: 0,
        max: 1000,
        normalized: scores[metric],
        sourceId: 'sample-catalog',
        updatedAt: fixtureDate,
      })),
      confidence: 0,
      methodology: methodologyVersion,
      scoreUpdatedAt: fixtureDate,
      lastVerifiedAt: null,
      sourceUpdatedAt: fixtureDate,
      sources: [
        {
          id: 'sample-catalog',
          name: 'Synapse fictional fixture catalog',
          url: '/methodology#sample-data',
          kind: 'mock',
          publisher: 'Local test fixtures',
          retrievedAt: fixtureDate,
        },
      ],
    };
  }),
);

// Load real verified models from verifiedModels.json generated by data pipeline
let verifiedModelsList: CatalogModel[] | null = null;
try {
  if (Array.isArray(verifiedCatalogRaw) && verifiedCatalogRaw.length > 0) {
    verifiedModelsList = validateCatalog(verifiedCatalogRaw);
  }
} catch (err) {
  console.warn(
    'Could not validate verifiedModels.json; falling back to mock fixtures.',
    err,
  );
}

export const models: CatalogModel[] =
  verifiedModelsList && verifiedModelsList.length > 0
    ? verifiedModelsList
    : mockModels;

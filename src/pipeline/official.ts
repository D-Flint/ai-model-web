import { OFFICIAL_PROVIDER_SPECS } from '../data/officialProviders';
import type { OfficialProviderSpec } from './types';

export function getOfficialProviderSpec(
  slug: string,
): OfficialProviderSpec | null {
  return OFFICIAL_PROVIDER_SPECS[slug] ?? null;
}

export function getAllOfficialProviderSpecs(): OfficialProviderSpec[] {
  return Object.values(OFFICIAL_PROVIDER_SPECS);
}

export interface OfficialVerificationResult {
  slug: string;
  isVerified: boolean;
  contextMatch: boolean;
  pricingMatch: boolean;
  officialSpec: OfficialProviderSpec;
  reportedContext?: number;
  reportedPricing?: { input: number; output: number };
  discrepancies: string[];
}

/**
 * Validates external aggregator data (e.g. OpenRouter) against official provider specifications.
 */
export function verifyAgainstOfficialSpecs(options: {
  slug: string;
  reportedContext?: number;
  reportedPricing?: { input: number; output: number };
}): OfficialVerificationResult {
  const { slug, reportedContext, reportedPricing } = options;
  const spec = getOfficialProviderSpec(slug);

  if (!spec) {
    return {
      slug,
      isVerified: false,
      contextMatch: false,
      pricingMatch: false,
      officialSpec: {
        slug,
        releaseDate: new Date().toISOString().split('T')[0],
        contextWindow: reportedContext ?? 128000,
        maxOutputTokens: 8192,
        supportsVision: false,
        supportsAudio: false,
        supportsTools: true,
        supportsStructuredOutput: true,
        apiAvailable: true,
        officialPricing: {
          input: reportedPricing?.input ?? 1,
          output: reportedPricing?.output ?? 2,
          cached: null,
        },
        lastVerifiedAt: new Date().toISOString().split('T')[0],
        sourceUrl: '',
        sourceName: 'Unknown',
      },
      discrepancies: ['No official provider specification defined for model'],
    };
  }

  const discrepancies: string[] = [];
  let contextMatch = true;
  let pricingMatch = true;

  if (reportedContext !== undefined && reportedContext !== spec.contextWindow) {
    contextMatch = false;
    discrepancies.push(
      `Context window discrepancy: reported ${reportedContext} vs official ${spec.contextWindow}`,
    );
  }

  if (reportedPricing) {
    const inputDiff = Math.abs(
      reportedPricing.input - spec.officialPricing.input,
    );
    const outputDiff = Math.abs(
      reportedPricing.output - spec.officialPricing.output,
    );
    if (inputDiff > 0.05 || outputDiff > 0.05) {
      pricingMatch = false;
      discrepancies.push(
        `Pricing discrepancy: reported $${reportedPricing.input}/$${reportedPricing.output} vs official $${spec.officialPricing.input}/$${spec.officialPricing.output}`,
      );
    }
  }

  return {
    slug,
    isVerified: discrepancies.length === 0,
    contextMatch,
    pricingMatch,
    officialSpec: spec,
    reportedContext,
    reportedPricing,
    discrepancies,
  };
}

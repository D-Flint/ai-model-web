import {
  defaultWorkloadProfile,
  workloadProfiles,
  type WorkloadProfile,
} from '../data/config';
import type { CatalogModel } from './catalogSchema';
import { singleRate } from './apiPricing';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export interface ModelPricingRates {
  input: number | null;
  output: number | null;
  cached: number | null;
}

/**
 * Extracts normalized per-million token rates from a model record,
 * inspecting official pricing fields with structured apiPricing fallbacks.
 */
export function getModelPricingRates(model: CatalogModel): ModelPricingRates {
  const input =
    model.pricing?.inputPer1M ??
    model.pricing?.input ??
    singleRate(model, 'input')?.value ??
    null;
  const output =
    model.pricing?.outputPer1M ??
    model.pricing?.output ??
    singleRate(model, 'output')?.value ??
    null;
  const cached =
    model.pricing?.cachedInputPer1M ??
    model.pricing?.cached ??
    singleRate(model, 'cached')?.value ??
    null;
  return { input, output, cached };
}

/**
 * Calculates the effective blended token price per 1M tokens based on
 * a given workload profile (accounting for cached input discounts).
 */
export function calculateEffectivePrice(
  rates: ModelPricingRates,
  profile: WorkloadProfile = workloadProfiles[defaultWorkloadProfile],
): number | null {
  if (rates.input === null || rates.output === null) return null;
  // If model does not publish cached pricing, cached tokens are charged at standard input rate.
  const effectiveCached = rates.cached ?? rates.input;
  const blended =
    effectiveCached * profile.cachedRatio +
    rates.input * profile.inputRatio +
    rates.output * profile.outputRatio;
  return Number(blended.toFixed(4));
}

/**
 * Calculates a 0-100 cost efficiency score from token pricing.
 * Inverts price logarithmically so that lower cost equals a higher efficiency score.
 * Factors in prompt caching discounts according to the selected workload profile.
 */
export function calculateCostEfficiencyScore(
  inputPerMillion: number,
  outputPerMillion: number,
  cachedPerMillion: number | null = null,
  profile: WorkloadProfile = workloadProfiles[defaultWorkloadProfile],
): {
  normalized: number;
  min: number;
  max: number;
  raw: number;
  effectivePrice: number;
} {
  const effectiveCached = cachedPerMillion ?? inputPerMillion;
  const blendedPrice =
    effectiveCached * profile.cachedRatio +
    inputPerMillion * profile.inputRatio +
    outputPerMillion * profile.outputRatio;

  const minCost = 0.05;
  const maxCost = 100.0;

  const safePrice = Math.max(minCost, Math.min(maxCost, blendedPrice));
  const logMin = Math.log10(minCost);
  const logMax = Math.log10(maxCost);
  const logPrice = Math.log10(safePrice);

  const calculated = 100 - ((logPrice - logMin) / (logMax - logMin)) * 100;
  const normalized = Math.round(clamp(calculated, 0, 100));

  return {
    raw: normalized,
    normalized,
    min: 0,
    max: 100,
    effectivePrice: Number(blendedPrice.toFixed(4)),
  };
}

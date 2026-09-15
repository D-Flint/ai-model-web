import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CostCalculator from '../src/components/CostCalculator';
import {
  calculateApiCost,
  validateModelWorkload,
  type Workload,
} from '../src/lib/apiPricing';
import { models } from '../src/data/models';

describe('Cost Calculator Workload Constraints (Issue 4)', () => {
  const model =
    models.find((m) => m.slug === 'deepseek-v4-1-flash') ?? models[0];

  it('validates workloads within operational hardware limits', () => {
    const validWorkload: Workload = {
      input: 10_000,
      cached: 50_000,
      output: 4_000,
      requests: 10,
    };

    const result = validateModelWorkload(model, validWorkload);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects workloads where output tokens exceed max output limit', () => {
    const excessiveOutputWorkload: Workload = {
      input: 1_000,
      cached: 0,
      output: model.facts.maxOutput + 10_000,
      requests: 1,
    };

    const result = validateModelWorkload(model, excessiveOutputWorkload);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors[0]).toContain('maximum output limit');
  });

  it('rejects workloads where total request tokens exceed context window', () => {
    const excessiveContextWorkload: Workload = {
      input: model.facts.context,
      cached: 10_000,
      output: 100,
      requests: 1,
    };

    const result = validateModelWorkload(model, excessiveContextWorkload);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors[0]).toContain('context window');
  });

  it('throws in calculateApiCost when impossible workload is provided with model', () => {
    const impossibleWorkload: Workload = {
      input: 1_000_000,
      cached: 0,
      output: 1_000_000,
      requests: 1,
    };

    expect(() =>
      calculateApiCost(
        model.apiPricing,
        impossibleWorkload,
        new Date('2026-09-15T12:00:00Z'),
        model,
      ),
    ).toThrow(/maximum output limit|context window/);
  });

  it('renders form with noValidate to allow custom validation notices instead of browser popups', () => {
    const html = renderToStaticMarkup(
      React.createElement(CostCalculator, { models: [model] }),
    );
    expect(html).toContain('noValidate=""');
  });
});

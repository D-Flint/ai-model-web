import { describe, it, expect } from 'vitest';
import { metricLabels } from '../src/data/config';
import { models } from '../src/data/models';
import { getModelEffortStats, composite } from '../src/lib/decision';

describe('Phase 2: Metric disambiguation and reasoning effort estimation', () => {
  it('disambiguates Synapse Composite from LiveBench Overall in metric labels', () => {
    expect(metricLabels.overall).toBe('Synapse Composite');
    expect(metricLabels.livebenchOverall).toBe('LiveBench Overall');
  });

  it('marks baseline effort as measured and non-default effort levels as estimated', () => {
    const reasoningModel = models.find(
      (m) =>
        m.facts.reasoningEffort &&
        m.facts.reasoningEffort.length > 1 &&
        m.facts.defaultEffort &&
        m.facts.defaultEffort !== 'none',
    );
    expect(reasoningModel).toBeDefined();
    if (!reasoningModel) return;

    const defaultEffort = reasoningModel.facts.defaultEffort!;
    const defaultStats = getModelEffortStats(reasoningModel, defaultEffort);
    expect(defaultStats.isMeasured).toBe(true);
    expect(defaultStats.isEstimated).toBe(false);

    const otherEffort = reasoningModel.facts.reasoningEffort.find(
      (e) => e !== defaultEffort && e !== 'none' && e !== 'fixed',
    );
    if (otherEffort) {
      const estimatedStats = getModelEffortStats(reasoningModel, otherEffort);
      expect(estimatedStats.isEstimated).toBe(true);
      expect(estimatedStats.isMeasured).toBe(false);
    }
  });

  it('marks non-reasoning and fixed CoT models as measured baseline', () => {
    const fixedModel = models.find((m) =>
      m.facts.reasoningEffort?.includes('fixed'),
    );
    if (fixedModel) {
      const stats = getModelEffortStats(fixedModel);
      expect(stats.isEstimated).toBe(false);
      expect(stats.isMeasured).toBe(true);
    }

    const nonReasoningModel = models.find(
      (m) =>
        !m.facts.reasoningEffort ||
        m.facts.reasoningEffort.length === 0 ||
        (m.facts.reasoningEffort.length === 1 &&
          m.facts.reasoningEffort[0] === 'none'),
    );
    if (nonReasoningModel) {
      const stats = getModelEffortStats(nonReasoningModel);
      expect(stats.isEstimated).toBe(false);
      expect(stats.isMeasured).toBe(true);
    }
  });

  it('computes composite weighted scores deterministically', () => {
    const scores = {
      intelligence: 80,
      coding: 90,
      agentic: 85,
      dailyUse: 75,
      research: 70,
      vision: 60,
      costEfficiency: 50,
      writing: 80,
      speed: 90,
      reliability: 85,
    };
    const comp = composite(scores);
    expect(comp).toBeGreaterThan(0);
    expect(comp).toBeLessThanOrEqual(100);
  });
});

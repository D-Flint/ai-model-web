import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ComparisonBuilder from '../src/components/ComparisonBuilder';
import { models } from '../src/data/models';
import { getMaxReasoningEffort } from '../src/lib/decision';

describe('ComparisonBuilder effort defaults', () => {
  it('defaults newly added reasoning models without an effort suffix to maximum possible effort', () => {
    const multiEffortModel = models.find(
      (m) =>
        m.facts.reasoningEffort &&
        m.facts.reasoningEffort.length > 1 &&
        !m.facts.reasoningEffort.includes('fixed'),
    );
    expect(multiEffortModel).toBeDefined();
    if (!multiEffortModel) return;

    const maxEffort = getMaxReasoningEffort(multiEffortModel);
    expect(maxEffort).not.toBe('none');
    expect(maxEffort).not.toBe('fixed');

    // Pick a second model for side-by-side comparison
    const secondModel = models.find((m) => m.slug !== multiEffortModel.slug)!;

    // Pass bare slugs (simulating newly added models or default route)
    const html = renderToStaticMarkup(
      <ComparisonBuilder
        models={models}
        initial={[multiEffortModel.slug, secondModel.slug]}
      />,
    );

    // The selection chip should show the max effort label
    expect(html).toContain(
      `(${maxEffort.charAt(0).toUpperCase() + maxEffort.slice(1)} effort)`,
    );

    // The dropdown option for the max effort should be selected
    expect(html).toContain(`value="${maxEffort}" selected=""`);
  });
});

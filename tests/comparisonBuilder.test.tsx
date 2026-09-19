import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ComparisonBuilder from '../src/components/ComparisonBuilder';
import { models } from '../src/data/models';

describe('ComparisonBuilder effort defaults', () => {
  it('renders the effort selector for a model with selectable reasoning tiers at default effort', () => {
    const museSpark = models.find((model) => model.slug === 'muse-spark-1-1');
    const secondModel = models.find((model) => model.slug !== 'muse-spark-1-1');

    expect(museSpark).toBeDefined();
    expect(secondModel).toBeDefined();
    if (!museSpark || !secondModel) return;

    const html = renderToStaticMarkup(
      <ComparisonBuilder
        models={models}
        initial={[museSpark.slug, secondModel.slug]}
      />,
    );

    expect(html).toContain('Reasoning Effort');
    expect(html).toContain('value="medium" selected=""');
    expect(html).not.toContain(
      'Muse Spark 1.1</a><div style="margin-top:6px"><span class="effort-badge effort-fixed">Fixed CoT',
    );
  });

  it('defaults newly added reasoning models without an effort suffix to default baseline effort', () => {
    const multiEffortModel = models.find(
      (m) =>
        m.facts.reasoningEffort &&
        m.facts.reasoningEffort.length > 1 &&
        !m.facts.reasoningEffort.includes('fixed'),
    );
    expect(multiEffortModel).toBeDefined();
    if (!multiEffortModel) return;

    const expectedEffort =
      multiEffortModel.facts.defaultEffort &&
      multiEffortModel.facts.defaultEffort !== 'none'
        ? multiEffortModel.facts.defaultEffort
        : 'medium';

    // Pick a second model for side-by-side comparison
    const secondModel = models.find((m) => m.slug !== multiEffortModel.slug)!;

    // Pass bare slugs (simulating newly added models or default route)
    const html = renderToStaticMarkup(
      <ComparisonBuilder
        models={models}
        initial={[multiEffortModel.slug, secondModel.slug]}
      />,
    );

    // The selection chip should show the default effort label
    expect(html).toContain(
      `(${expectedEffort.charAt(0).toUpperCase() + expectedEffort.slice(1)} effort)`,
    );

    // The dropdown option for the default effort should be selected
    expect(html).toContain(`value="${expectedEffort}" selected=""`);
  });

  it('preserves explicit reasoning effort suffix when provided in initial selection', () => {
    const multiEffortModel = models.find(
      (m) =>
        m.facts.reasoningEffort &&
        m.facts.reasoningEffort.includes('low') &&
        m.facts.reasoningEffort.includes('high'),
    );
    expect(multiEffortModel).toBeDefined();
    if (!multiEffortModel) return;

    const secondModel = models.find((m) => m.slug !== multiEffortModel.slug)!;

    const html = renderToStaticMarkup(
      <ComparisonBuilder
        models={models}
        initial={[`${multiEffortModel.slug}:low`, secondModel.slug]}
      />,
    );

    expect(html).toContain('(Low effort)');
    expect(html).toContain('value="low" selected=""');
  });
});

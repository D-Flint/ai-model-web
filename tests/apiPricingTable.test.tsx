import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PricingComparison from '../src/components/PricingComparison';
import { models } from '../src/data/models';

describe('PricingComparison table structure', () => {
  it('renders table rows with uniform semantic classes and clamped containers', () => {
    const html = renderToStaticMarkup(
      <PricingComparison models={models.slice(0, 5)} />,
    );
    expect(html).toContain('class="cost-table pricing-table"');
    expect(html).toContain('class="pricing-row"');
    expect(html).toContain('class="col-model"');
    expect(html).toContain('class="col-provider"');
    expect(html).toContain('class="col-rate"');
    expect(html).toContain('class="col-context"');
    expect(html).toContain('class="col-notes"');
    expect(html).toContain('class="col-source"');
    expect(html).toContain('class="pricing-notes"');
  });
});

import { describe, expect, it } from 'vitest';
import { formatTokenContext } from '../src/utils/formatters';
import { contextSize } from '../src/lib/decision';

describe('token context formatting', () => {
  it('formats decimal and binary context sizes without long fractions', () => {
    expect(formatTokenContext(1_048_576)).toBe('1.05M tokens');
    expect(contextSize(1_048_576)).toBe('1.05M');
    expect(formatTokenContext(1_000_000)).toBe('1M tokens');
    expect(formatTokenContext(128_000)).toBe('128K tokens');
    expect(formatTokenContext(999)).toBe('999 tokens');
    for (const value of [null, undefined, 0, -1, NaN, Infinity]) {
      expect(formatTokenContext(value)).toBe('—');
    }
  });
});

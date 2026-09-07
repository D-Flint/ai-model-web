import { describe, expect, it } from 'vitest';
import { getModalitiesLabel } from '../src/lib/modalities';

describe('getModalitiesLabel', () => {
  it.each([
    [{ vision: true, audio: true }, 'Text + vision + audio'],
    [{ vision: true, audio: false }, 'Text + vision'],
    [{ vision: false, audio: true }, 'Text + audio'],
    [{ vision: false, audio: false }, 'Text'],
  ] as const)('describes %j as %s', (capabilities, expected) => {
    expect(getModalitiesLabel(capabilities)).toBe(expected);
  });
});

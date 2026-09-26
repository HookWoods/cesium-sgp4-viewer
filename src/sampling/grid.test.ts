import { describe, expect, it } from 'vitest';

import { gridRange, perigeeSweepFactor, ringSegments, sampleStepMs } from './grid.js';

describe('perigeeSweepFactor', () => {
  it('is 1 for a circle and grows with eccentricity', () => {
    expect(perigeeSweepFactor(0)).toBe(1);
    expect(perigeeSweepFactor(0.7)).toBeGreaterThan(perigeeSweepFactor(0.3));
  });
});

describe('sampleStepMs', () => {
  it('takes 36 samples per revolution of a circular orbit', () => {
    expect(sampleStepMs(5_400, 0)).toBe(150_000);
  });

  it('samples an eccentric orbit more densely', () => {
    expect(sampleStepMs(43_000, 0.7)).toBeLessThan(sampleStepMs(43_000, 0) / 5);
  });

  it('returns whole milliseconds with a floor', () => {
    expect(Number.isInteger(sampleStepMs(5_555.5, 0.01))).toBe(true);
    expect(sampleStepMs(1, 0)).toBe(10_000);
  });
});

describe('ringSegments', () => {
  it('uses 64 chords for a circle and at most 512', () => {
    expect(ringSegments(0)).toBe(64);
    expect(ringSegments(0.95)).toBe(512);
  });
});

describe('gridRange', () => {
  it('covers the window with three nodes of margin on each side', () => {
    expect(gridRange(1_000, 9_000, 1_000)).toEqual({ first: -2, last: 12 });
  });
});

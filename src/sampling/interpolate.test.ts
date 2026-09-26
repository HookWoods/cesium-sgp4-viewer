import { twoline2satrec } from 'satellite.js';
import { describe, expect, it } from 'vitest';

import { ISS, POLAR } from '../__fixtures__/tles.js';
import { propagateToFixed } from '../sgp4/propagate.js';
import { sampleStepMs } from './grid.js';
import { interpolateSamples } from './interpolate.js';

const out = { x: 0, y: 0, z: 0 };

describe('interpolateSamples', () => {
  it('reproduces a polynomial of degree 5 exactly', () => {
    const f = (t: number) => 2 + t - 0.5 * t ** 3 + 0.01 * t ** 5;
    const samples = new Float32Array(30);
    for (let k = 0; k < 10; k++) samples.set([f(k), -f(k), 2 * f(k)], k * 3);

    const value = interpolateSamples(samples, 0, 10, 0, 1, 4.5, out)!;
    expect(value.x).toBeCloseTo(f(4.5), 3);
    expect(value.y).toBeCloseTo(-f(4.5), 3);
  });

  it('honours the offset and refuses to extrapolate', () => {
    const samples = new Float32Array([9, 9, 9, 0, 0, 0, 1, 1, 1, 2, 2, 2]);
    expect(interpolateSamples(samples, 1, 3, 1_000, 1_000, 2_500, out)?.x).toBeCloseTo(1.5, 5);
    expect(interpolateSamples(samples, 1, 3, 1_000, 1_000, 999, out)).toBeNull();
    expect(interpolateSamples(samples, 1, 3, 1_000, 1_000, 3_001, out)).toBeNull();
  });

  it('returns null next to a gap', () => {
    const samples = new Float32Array([0, 0, 0, NaN, NaN, NaN, 2, 2, 2]);
    expect(interpolateSamples(samples, 0, 3, 0, 1, 0.5, out)).toBeNull();
  });

  it.each([
    ['ISS', ISS],
    ['POLAR (e = 0.66)', POLAR],
  ])('stays within 50 m of SGP4 for %s', (_, { line1, line2 }) => {
    const satrec = twoline2satrec(line1, line2);
    const step = sampleStepMs((2 * Math.PI * 60) / satrec.no, satrec.ecco);
    const first = Math.floor(Date.UTC(2026, 8, 26) / step);
    const count = 200;
    const samples = new Float32Array(count * 3);
    for (let k = 0; k < count; k++) {
      const p = propagateToFixed(satrec, (first + k) * step)!;
      samples.set([p.x, p.y, p.z], k * 3);
    }

    let worst = 0;
    for (let ms = (first + 3) * step; ms < (first + count - 3) * step; ms += step / 7) {
      const expected = propagateToFixed(satrec, ms)!;
      const actual = interpolateSamples(samples, 0, count, first * step, step, ms, out)!;
      worst = Math.max(
        worst,
        Math.hypot(actual.x - expected.x, actual.y - expected.y, actual.z - expected.z),
      );
    }
    expect(worst).toBeLessThan(50);
  });
});

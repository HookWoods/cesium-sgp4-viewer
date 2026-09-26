import { eciToEcf, gstime, propagate, twoline2satrec } from 'satellite.js';
import { describe, expect, it } from 'vitest';

import { GPS, ISS } from '../__fixtures__/tles.js';
import { gmstAt, propagateTeme, propagateToFixed, temeToFixed } from './propagate.js';

const at = new Date('2026-09-26T12:00:00Z');

describe('propagateToFixed', () => {
  it('agrees with the satellite.js propagate + eciToEcf pipeline', () => {
    for (const { line1, line2 } of [ISS, GPS]) {
      const expected = propagate(twoline2satrec(line1, line2), at);
      if (!expected) throw new Error('fixture does not propagate');
      const ecf = eciToEcf(expected.position, gstime(at));
      const actual = propagateToFixed(twoline2satrec(line1, line2), at);

      expect(actual).not.toBeNull();
      expect(actual!.x).toBeCloseTo(ecf.x * 1000, -1);
      expect(actual!.y).toBeCloseTo(ecf.y * 1000, -1);
      expect(actual!.z).toBeCloseTo(ecf.z * 1000, -1);
    }
  });

  it('puts the ISS about 400 km above the ground', () => {
    const position = propagateToFixed(twoline2satrec(ISS.line1, ISS.line2), at)!;
    const radius = Math.hypot(position.x, position.y, position.z);
    expect(radius - 6_371e3).toBeGreaterThan(300e3);
    expect(radius - 6_371e3).toBeLessThan(500e3);
  });

  it('returns null once SGP4 gives up', () => {
    // Fifty years after epoch the ISS has long decayed.
    const satrec = twoline2satrec(ISS.line1, ISS.line2);
    expect(propagateTeme(satrec, Date.UTC(2076, 0, 1))).toBeNull();
  });
});

describe('temeToFixed', () => {
  it('is a rotation about z that keeps the norm', () => {
    const teme = { x: 7000e3, y: -1200e3, z: 300e3 };
    const fixed = temeToFixed(teme, gmstAt(at.getTime()));
    expect(Math.hypot(fixed.x, fixed.y, fixed.z)).toBeCloseTo(
      Math.hypot(7000e3, -1200e3, 300e3),
      3,
    );
    expect(fixed.z).toBe(300e3);
  });
});

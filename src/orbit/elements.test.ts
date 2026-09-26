import { twoline2satrec } from 'satellite.js';
import { describe, expect, it } from 'vitest';

import { INTELSAT, ISS } from '../__fixtures__/tles.js';
import { orbitalElements } from './elements.js';

describe('orbitalElements', () => {
  it('derives the ISS orbit', () => {
    const elements = orbitalElements(twoline2satrec(ISS.line1, ISS.line2));
    expect(elements.epoch.toISOString().slice(0, 10)).toBe('2026-09-26');
    expect(elements.eccentricity).toBeCloseTo(0.0007829, 7);
    expect(elements.raanDeg).toBeCloseTo(161.0895, 4);
    expect(elements.meanMotionRevPerDay).toBeCloseTo(15.486, 1);
    expect(elements.perigeeAltitudeM).toBeGreaterThan(380e3);
    expect(elements.apogeeAltitudeM).toBeLessThan(450e3);
  });

  it('puts a geostationary satellite near 35,786 km', () => {
    const elements = orbitalElements(twoline2satrec(INTELSAT.line1, INTELSAT.line2));
    expect(Math.abs(elements.apogeeAltitudeM - 35_786e3)).toBeLessThan(100e3);
  });
});

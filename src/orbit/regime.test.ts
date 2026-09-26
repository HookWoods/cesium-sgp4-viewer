import { describe, expect, it } from 'vitest';

import { classifyRegime, ORBIT_REGIMES, regimeCode } from './regime.js';

const circular = { eccentricity: 0.001 };

describe('classifyRegime', () => {
  it('classifies by altitude and period', () => {
    expect(classifyRegime({ ...circular, apogeeAltitudeM: 550e3, meanMotionRevPerDay: 15 })).toBe(
      'LEO',
    );
    expect(classifyRegime({ ...circular, apogeeAltitudeM: 20_200e3, meanMotionRevPerDay: 2 })).toBe(
      'MEO',
    );
    expect(classifyRegime({ ...circular, apogeeAltitudeM: 35_786e3, meanMotionRevPerDay: 1 })).toBe(
      'GEO',
    );
  });

  it('puts eccentric orbits in HEO whatever their period', () => {
    expect(
      classifyRegime({ eccentricity: 0.72, apogeeAltitudeM: 39_000e3, meanMotionRevPerDay: 2 }),
    ).toBe('HEO');
  });

  it('leaves an eccentric orbit with a one-day period out of GEO', () => {
    expect(
      classifyRegime({ eccentricity: 0.15, apogeeAltitudeM: 42_000e3, meanMotionRevPerDay: 1 }),
    ).toBe('MEO');
  });
});

describe('regimeCode', () => {
  it('is the index in ORBIT_REGIMES', () => {
    expect(ORBIT_REGIMES.map(regimeCode)).toEqual([0, 1, 2, 3]);
  });
});

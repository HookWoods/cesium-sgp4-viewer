import { twoline2satrec } from 'satellite.js';
import { describe, expect, it } from 'vitest';

import { ISS } from '../__fixtures__/tles.js';
import { buildRings } from './rings.js';

describe('buildRings', () => {
  it('breaks the ring where SGP4 gives up', () => {
    const satrec = twoline2satrec(ISS.line1, ISS.line2);
    const rings = buildRings(
      [{ satrec, periodSeconds: 5_580, segments: 64 }],
      Date.UTC(2076, 0, 1),
    );
    expect(rings.indexCount[0]).toBe(0);
    expect(rings.vertices.length).toBe(0);
  });
});

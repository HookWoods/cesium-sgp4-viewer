import { twoline2satrec } from 'satellite.js';
import { describe, expect, it } from 'vitest';

import { GPS, INTELSAT, ISS } from '../__fixtures__/tles.js';
import { ringSegments } from '../sampling/grid.js';
import { RING_VERTEX_FLOATS } from './protocol.js';
import { ShardSampler } from './sampler.js';

const tles = [ISS, GPS, INTELSAT].flatMap((t) => [t.line1, t.line2]);
const HOUR = 3_600_000;
const t0 = Date.UTC(2026, 8, 26, 12);

describe('ShardSampler.sample', () => {
  it('packs every satellite with its grid', () => {
    const result = new ShardSampler(tles).sample(7, t0, t0 + 4 * HOUR);
    expect(result.requestId).toBe(7);
    expect([...result.counts].every((count) => count > 0)).toBe(true);
    expect(result.positions.length).toBe(3 * result.counts.reduce((a, b) => a + b, 0));
    // The first sample sits on the grid and before the window, with interpolation margin.
    for (let j = 0; j < 3; j++) {
      expect(result.firstMs[j]! % result.stepMs[j]!).toBe(0);
      expect(result.firstMs[j]).toBeLessThan(t0);
    }
  });

  it('gives the same samples whether the window moved or started fresh', () => {
    const moved = new ShardSampler(tles);
    moved.sample(0, t0, t0 + 4 * HOUR);
    const incremental = moved.sample(1, t0 + HOUR, t0 + 5 * HOUR);
    const fresh = new ShardSampler(tles).sample(0, t0 + HOUR, t0 + 5 * HOUR);

    expect(incremental.counts).toEqual(fresh.counts);
    expect(incremental.firstMs).toEqual(fresh.firstMs);
    expect(incremental.positions).toEqual(fresh.positions);
  });

  it('gives the same samples after a move back in time or a jump', () => {
    const moved = new ShardSampler(tles);
    moved.sample(0, t0 + HOUR, t0 + 5 * HOUR);
    const back = moved.sample(1, t0, t0 + 4 * HOUR);
    expect(back.positions).toEqual(new ShardSampler(tles).sample(0, t0, t0 + 4 * HOUR).positions);

    const jump = moved.sample(2, t0 + 48 * HOUR, t0 + 52 * HOUR);
    const fresh = new ShardSampler(tles).sample(0, t0 + 48 * HOUR, t0 + 52 * HOUR);
    expect(jump.positions).toEqual(fresh.positions);
  });

  it('reports a decayed satellite with a count of 0', () => {
    const sampler = new ShardSampler([ISS.line1, ISS.line2]);
    const result = sampler.sample(0, Date.UTC(2076, 0, 1), Date.UTC(2076, 0, 1) + HOUR);
    expect(result.counts[0]).toBe(0);
  });
});

describe('ShardSampler.rings', () => {
  it('draws one revolution per satellite', () => {
    const rings = new ShardSampler(tles).rings(t0);
    const segments = [ISS, GPS, INTELSAT].map((t) =>
      ringSegments(twoline2satrec(t.line1, t.line2).ecco),
    );

    expect(rings.vertices.length).toBe(
      segments.reduce((sum, s) => sum + s + 1, 0) * RING_VERTEX_FLOATS,
    );
    expect([...rings.indexCount]).toEqual(segments.map((s) => 2 * s));
    expect([...rings.indexStart]).toEqual([0, 2 * segments[0]!, 2 * (segments[0]! + segments[1]!)]);
    // The farthest vertex belongs to the geostationary satellite.
    expect(rings.radius).toBeGreaterThan(42_000e3);
    expect(rings.radius).toBeLessThan(42_400e3);

    // tau spans half a period either side of the epoch.
    const period = rings.vertices[4]!;
    const last = segments[0]! * RING_VERTEX_FLOATS;
    expect(rings.vertices[3]).toBeCloseTo(-period / 2, 0);
    expect(rings.vertices[last + 3]).toBeCloseTo(period / 2, 0);
  });
});

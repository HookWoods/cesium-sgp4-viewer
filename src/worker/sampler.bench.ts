import { test } from 'vitest';

import { GPS, INTELSAT, ISS, POLAR } from '../__fixtures__/tles.js';
import { ShardSampler } from './sampler.js';

const HOUR = 3_600_000;
const t0 = Date.UTC(2026, 8, 26, 12);

/**
 * Line 1 and line 2 of `size` element sets, in turn, as a worker receives its
 * shard. Mostly LEO, like a real catalog.
 */
const shardLines = (size: number): string[] => {
  const mix = [ISS, ISS, ISS, ISS, ISS, ISS, ISS, GPS, INTELSAT, POLAR];
  return Array.from({ length: size }, (_, i) => mix[i % mix.length]!).flatMap((t) => [
    t.line1,
    t.line2,
  ]);
};

// One worker's shard of a 30,000-object catalog, with the default pool of four.
const sampler = new ShardSampler(shardLines(7_500));
let ms = t0;
sampler.sample(0, ms - 2 * HOUR, ms + 2 * HOUR);

test('ShardSampler, 7,500 satellites', async ({ bench }) => {
  // The default window moves once the playhead is 30 minutes from an edge.
  await bench('window move', () => {
    ms += 1.5 * HOUR;
    sampler.sample(0, ms - 2 * HOUR, ms + 2 * HOUR);
  }).run({ time: 1_000, iterations: 10 });

  await bench('rings', () => {
    sampler.rings(t0);
  }).run({ time: 1_000, iterations: 10 });
});

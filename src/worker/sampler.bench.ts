import { test } from 'vitest';

import { shardLines } from '../__fixtures__/tles.js';
import { ShardSampler } from './sampler.js';

const HOUR = 3_600_000;
const t0 = Date.UTC(2026, 8, 26, 12);

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

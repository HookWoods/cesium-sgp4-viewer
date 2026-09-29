import { twoline2satrec } from 'satellite.js';
import { test } from 'vitest';

import { ISS } from '../__fixtures__/tles.js';
import { propagateToFixed } from '../sgp4/propagate.js';
import { sampleStepMs } from './grid.js';
import { interpolateSamples } from './interpolate.js';

const satrec = twoline2satrec(ISS.line1, ISS.line2);
const step = sampleStepMs((2 * Math.PI * 60) / satrec.no, satrec.ecco);
const first = Math.floor(Date.UTC(2026, 8, 26) / step);
const count = 100;
const samples = new Float32Array(count * 3);
for (let k = 0; k < count; k++) {
  const p = propagateToFixed(satrec, (first + k) * step)!;
  samples.set([p.x, p.y, p.z], k * 3);
}

// A local reference: an imported binding is a getter under Vitest's module runner.
const interpolate = interpolateSamples;
const out = { x: 0, y: 0, z: 0 };
const now = (first + count / 2) * step;

// What the main thread does on every frame the clock moves.
test('interpolateSamples', async ({ bench }) => {
  await bench('one frame of 30,000 satellites', () => {
    for (let i = 0; i < 30_000; i++) {
      interpolate(samples, 0, count, first * step, step, now + i, out);
    }
  }).run();
});

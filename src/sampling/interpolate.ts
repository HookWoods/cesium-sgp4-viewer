import type { Vector3 } from '../sgp4/propagate.js';
import { INTERPOLATION_NODES } from './grid.js';

/**
 * Evaluates a trajectory sampled on a uniform grid.
 *
 * `samples` holds `count` positions (x, y, z interleaved) starting at float
 * index `offset * 3`, the first one at `firstMs` and then every `stepMs`. The
 * value at `ms` is the Lagrange polynomial through the {@link
 * INTERPOLATION_NODES} samples around it: with 36 samples per revolution it
 * stays within a few metres of SGP4, at a fraction of its cost.
 *
 * Returns `null` outside the samples, and when a node is `NaN` (SGP4 failed
 * there): no position rather than an invented one.
 */
export const interpolateSamples = (
  samples: Float32Array,
  offset: number,
  count: number,
  firstMs: number,
  stepMs: number,
  ms: number,
  out: Vector3,
): Vector3 | null => {
  const u = (ms - firstMs) / stepMs;
  if (!(u >= 0 && u <= count - 1)) return null;

  const nodes = Math.min(INTERPOLATION_NODES, count);
  // The nodes around `u`, centred where possible, shifted inwards at the ends.
  const first = Math.min(Math.max(Math.floor(u) - (nodes >> 1) + 1, 0), count - nodes);
  const t = u - first;

  let x = 0;
  let y = 0;
  let z = 0;
  let base = (offset + first) * 3;
  for (let j = 0; j < nodes; j++, base += 3) {
    let weight = 1;
    for (let m = 0; m < nodes; m++) {
      if (m !== j) weight *= (t - m) / (j - m);
    }
    x += weight * samples[base]!;
    y += weight * samples[base + 1]!;
    z += weight * samples[base + 2]!;
  }

  if (Number.isNaN(x + y + z)) return null;
  out.x = x;
  out.y = y;
  out.z = z;
  return out;
};

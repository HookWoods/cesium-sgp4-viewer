import type { SatRec } from 'satellite.js';

import { MS_PER_SECOND } from '../constants.js';
import { propagateTeme } from '../sgp4/propagate.js';
import { RING_VERTEX_FLOATS, type RingBuffers } from './protocol.js';

/** An orbit to draw: its element set, period and resolution. */
export interface RingSpec {
  satrec: SatRec;
  periodSeconds: number;
  segments: number;
}

const scratch = { x: 0, y: 0, z: 0 };

/**
 * One revolution of each orbit, centred on `epochMs`, in TEME.
 *
 * TEME rather than Earth-fixed: a ring is an inertial shape, and the renderer
 * turns it under the Earth with one matrix per frame instead of rebuilding it.
 * Consecutive valid points are joined; a point SGP4 refuses breaks the ring.
 * Used by the workers for the whole catalog and by the main thread for the
 * selected satellite, so a highlight lies exactly on its ring.
 */
export const buildRings = (specs: readonly RingSpec[], epochMs: number): RingBuffers => {
  let vertexCapacity = 0;
  for (const spec of specs) vertexCapacity += spec.segments + 1;

  const vertices = new Float32Array(vertexCapacity * RING_VERTEX_FLOATS);
  const indices = new Uint32Array(vertexCapacity * 2);
  const indexStart = new Uint32Array(specs.length);
  const indexCount = new Uint32Array(specs.length);
  let vertex = 0;
  let index = 0;
  let maxRadiusSquared = 0;

  specs.forEach(({ satrec, periodSeconds, segments }, j) => {
    indexStart[j] = index;
    let previous = -1;

    for (let k = 0; k <= segments; k++) {
      const tau = (k / segments - 0.5) * periodSeconds;
      const position = propagateTeme(satrec, epochMs + tau * MS_PER_SECOND, scratch);
      if (!position) {
        previous = -1;
        continue;
      }

      const o = vertex * RING_VERTEX_FLOATS;
      vertices[o] = position.x;
      vertices[o + 1] = position.y;
      vertices[o + 2] = position.z;
      vertices[o + 3] = tau;
      vertices[o + 4] = periodSeconds;
      maxRadiusSquared = Math.max(
        maxRadiusSquared,
        position.x ** 2 + position.y ** 2 + position.z ** 2,
      );

      if (previous >= 0) {
        indices[index++] = previous;
        indices[index++] = vertex;
      }
      previous = vertex;
      vertex++;
    }

    indexCount[j] = index - indexStart[j];
  });

  return {
    epochMs,
    vertices: vertices.slice(0, vertex * RING_VERTEX_FLOATS),
    indices: indices.slice(0, index),
    indexStart,
    indexCount,
    radius: Math.sqrt(maxRadiusSquared),
  };
};

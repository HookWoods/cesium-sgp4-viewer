// Pinned to satellite.js 6.x on purpose. From 7.0 the package's only entry also
// reaches its WASM bulk propagator, whose multi-threaded build uses top-level
// await: bundlers then fail to build any `iife` worker (ours, and Vite apps'
// with the default worker format), although that code is never called here.
// Move to 7.x once satellite.js publishes an entry without WASM, or drops the
// top-level await; see the matching ignore rule in .github/dependabot.yml.
import { gstime, type SatRec, sgp4 } from 'satellite.js';

import { MINUTES_PER_DAY, toJulianDate } from '../constants.js';

/** A position or velocity, in metres (per second). */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

const KM_TO_M = 1_000;

/** Minutes from the element set's epoch to `ms` (Unix time), the time SGP4 takes. */
export const minutesSinceEpoch = (satrec: SatRec, ms: number): number =>
  (toJulianDate(ms) - satrec.jdsatepoch) * MINUTES_PER_DAY;

/** Greenwich mean sidereal time at `ms` (Unix time), in radians. */
export const gmstAt = (ms: number): number => gstime(toJulianDate(ms));

/**
 * SGP4 position at `ms` (Unix time) in the TEME frame, in metres, or `null`
 * when SGP4 gives up (a decayed orbit, most often).
 *
 * Calls `sgp4` with the offset from epoch directly, rather than `propagate`
 * with a `Date`, so a tight loop allocates nothing but the result.
 */
export const propagateTeme = (
  satrec: SatRec,
  ms: number,
  out: Vector3 = { x: 0, y: 0, z: 0 },
): Vector3 | null => {
  const state = sgp4(satrec, minutesSinceEpoch(satrec, ms));
  const position = state?.position;
  if (
    !position ||
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y) ||
    !Number.isFinite(position.z)
  ) {
    return null;
  }
  out.x = position.x * KM_TO_M;
  out.y = position.y * KM_TO_M;
  out.z = position.z * KM_TO_M;
  return out;
};

/**
 * Rotates a TEME vector into the Earth-fixed frame by the sidereal angle.
 *
 * This is the usual SGP4 approximation (the one `satellite.js` `eciToEcf`
 * makes): polar motion and the equation of the equinoxes are ignored, an error
 * of a few tens of metres, far below what a globe can show. `out` may be `teme`.
 */
export const temeToFixed = (teme: Vector3, gmst: number, out: Vector3 = { x: 0, y: 0, z: 0 }) => {
  const cos = Math.cos(gmst);
  const sin = Math.sin(gmst);
  const { x, y, z } = teme;
  out.x = cos * x + sin * y;
  out.y = cos * y - sin * x;
  out.z = z;
  return out;
};

/**
 * SGP4 position at `date` in the Earth-fixed frame (the frame CesiumJS draws in
 * by default), in metres, or `null` when SGP4 gives up.
 */
export const propagateToFixed = (
  satrec: SatRec,
  date: Date | number,
  out: Vector3 = { x: 0, y: 0, z: 0 },
): Vector3 | null => {
  const ms = typeof date === 'number' ? date : date.getTime();
  const teme = propagateTeme(satrec, ms, out);
  return teme && temeToFixed(teme, gmstAt(ms), teme);
};

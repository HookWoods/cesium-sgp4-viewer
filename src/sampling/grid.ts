/*
 * How densely each orbit is sampled in time. Pure arithmetic, shared by the
 * workers and the main thread.
 */

/** Samples per revolution for a circular orbit: one every 10° of anomaly. */
const BASE_SAMPLES_PER_REVOLUTION = 36;

/** Ceiling for very eccentric orbits. */
const MAX_SAMPLES_PER_REVOLUTION = 720;

/** Floor on the step, so a degenerate period never asks for sub-second sampling. */
const MIN_STEP_MS = 10_000;

/** Segments per drawn ring for a circular orbit, and the ceiling for eccentric ones. */
const BASE_RING_SEGMENTS = 64;
const MAX_RING_SEGMENTS = 512;

/**
 * How much faster than average an orbit sweeps its anomaly at perigee:
 * `(1 + e)² / (1 − e²)^1.5`, 1 for a circle.
 *
 * Uniform time steps sized for the mean motion would cut the corner at the
 * perigee of an eccentric orbit, so both the sample count and the ring
 * resolution scale with it.
 */
export const perigeeSweepFactor = (eccentricity: number): number => {
  const e = Math.min(Math.max(eccentricity, 0), 0.95);
  return (1 + e) ** 2 / (1 - e * e) ** 1.5;
};

/**
 * Time between two samples of an orbit, in whole milliseconds.
 *
 * Whole milliseconds, and a function of the orbit alone, because the sampling
 * grid is anchored on the Unix epoch (sample `k` sits at `k · step`): an orbit
 * always lands on the same instants, so a window that moves can reuse every
 * sample it shares with the previous one.
 */
export const sampleStepMs = (periodSeconds: number, eccentricity: number): number => {
  const samples = Math.min(
    MAX_SAMPLES_PER_REVOLUTION,
    Math.ceil(BASE_SAMPLES_PER_REVOLUTION * perigeeSweepFactor(eccentricity)),
  );
  return Math.max(MIN_STEP_MS, Math.round((periodSeconds * 1000) / samples));
};

/** Chords used to draw one revolution. */
export const ringSegments = (eccentricity: number): number =>
  Math.min(MAX_RING_SEGMENTS, Math.ceil(BASE_RING_SEGMENTS * perigeeSweepFactor(eccentricity)));

/** Interpolation nodes: a degree-5 polynomial through 6 samples. */
export const INTERPOLATION_NODES = 6;

/**
 * The range of grid indices `[first, last]` whose samples cover `[startMs,
 * stopMs]` with enough nodes on each side to interpolate up to the edges.
 */
export const gridRange = (
  startMs: number,
  stopMs: number,
  stepMs: number,
): { first: number; last: number } => {
  const margin = INTERPOLATION_NODES / 2;
  return {
    first: Math.floor(startMs / stepMs) - margin,
    last: Math.ceil(stopMs / stepMs) + margin,
  };
};

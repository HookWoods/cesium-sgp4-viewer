/*
 * Arithmetic of the example's timeline: the playhead stays in the middle and
 * the axis scrolls under it. Pure functions, shared by both examples.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const TIMELINE_MIN_SPAN_MS = 5 * MINUTE;
export const TIMELINE_MAX_SPAN_MS = 24 * HOUR;
export const TIMELINE_DEFAULT_SPAN_MS = HOUR;

/** Round spacings people read time in. */
const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 180, 360].map((minutes) => minutes * MINUTE);

/** The finest spacing that keeps at most `maxTicks` labels on the axis. */
export const tickStep = (spanMs: number, maxTicks: number): number =>
  STEPS.find((step) => spanMs / step <= maxTicks) ?? STEPS[STEPS.length - 1]!;

/** Tick instants over the span centred on `centreMs`, aligned on whole steps of UTC. */
export const ticks = (centreMs: number, spanMs: number, step: number): number[] => {
  const result: number[] = [];
  for (
    let t = Math.ceil((centreMs - spanMs / 2) / step) * step;
    t <= centreMs + spanMs / 2;
    t += step
  ) {
    result.push(t);
  }
  return result;
};

/** Wheel zoom: about 15% per notch, clamped. */
export const zoomSpan = (spanMs: number, deltaY: number): number =>
  Math.min(TIMELINE_MAX_SPAN_MS, Math.max(TIMELINE_MIN_SPAN_MS, spanMs * 1.0015 ** deltaY));

export const formatTick = (ms: number): string => {
  const date = new Date(ms);
  const time = date.toISOString().slice(11, 16);
  return time === '00:00' ? date.toISOString().slice(5, 10) : time;
};

export const SPEEDS = [1, 10, 60, 300, 600] as const;

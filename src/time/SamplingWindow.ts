const HOUR_MS = 3_600_000;

export interface SamplingWindowOptions {
  /** Half the span propagated around the playhead. Default: 2 hours. */
  halfWidthMs?: number;
  /**
   * How close the playhead may come to an edge before the window is moved.
   * Default: 30 minutes, which leaves time for the next window to arrive even
   * at high playback speed.
   */
  marginMs?: number;
}

/**
 * The span of time the workers have sampled, around the playhead.
 *
 * It is a cache, not a limit: when the playhead nears an edge, a new window is
 * centred on it. Playback itself is never bounded.
 */
export class SamplingWindow {
  readonly startMs: number;
  readonly stopMs: number;
  private readonly marginMs: number;

  private constructor(startMs: number, stopMs: number, marginMs: number) {
    this.startMs = startMs;
    this.stopMs = stopMs;
    this.marginMs = marginMs;
  }

  static around(
    ms: number,
    { halfWidthMs = 2 * HOUR_MS, marginMs = HOUR_MS / 2 }: SamplingWindowOptions = {},
  ) {
    if (!(halfWidthMs > marginMs && marginMs >= 0)) {
      throw new RangeError('halfWidthMs must be greater than marginMs, and marginMs non-negative');
    }
    return new SamplingWindow(ms - halfWidthMs, ms + halfWidthMs, marginMs);
  }

  get centreMs(): number {
    return (this.startMs + this.stopMs) / 2;
  }

  contains(ms: number): boolean {
    return ms >= this.startMs && ms <= this.stopMs;
  }

  /** Whether the playhead at `ms` is close enough to an edge (or past it) to move the window. */
  needsMove(ms: number): boolean {
    return ms - this.startMs < this.marginMs || this.stopMs - ms < this.marginMs;
  }
}

/**
 * How long a set of orbit rings stays valid. Nodal precession turns a LEO plane
 * by a few degrees a day: an hour of drift is invisible, and rebuilding the
 * rings on every window move would cost far more than the samples.
 */
export const RING_LIFETIME_MS = HOUR_MS;

export const ringsNeedRebuild = (ringEpochMs: number | null, ms: number): boolean =>
  ringEpochMs === null || Math.abs(ms - ringEpochMs) >= RING_LIFETIME_MS;

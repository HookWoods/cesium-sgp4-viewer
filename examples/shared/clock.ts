import { ClockStep, JulianDate, type Viewer } from 'cesium';

/** What the transport shows, read off the viewer's clock. */
export interface ClockState {
  ms: number;
  /** Following the wall clock. */
  isLive: boolean;
  isPlaying: boolean;
  /** Speed magnitude (the multiplier's absolute value). */
  speed: number;
  isReversed: boolean;
}

export const readClock = ({ clock }: Viewer): ClockState => ({
  ms: JulianDate.toDate(clock.currentTime).getTime(),
  isLive: clock.clockStep === ClockStep.SYSTEM_CLOCK,
  isPlaying: clock.shouldAnimate,
  speed: Math.abs(clock.multiplier),
  isReversed: clock.multiplier < 0,
});

/** Back to real time, or away from it (keeping the current instant). */
export const setLive = (viewer: Viewer, live: boolean): void => {
  const { clock } = viewer;
  if (live) {
    clock.multiplier = 1;
    clock.shouldAnimate = true;
  }
  clock.clockStep = live ? ClockStep.SYSTEM_CLOCK : ClockStep.SYSTEM_CLOCK_MULTIPLIER;
  viewer.scene.requestRender();
};

export const setPlaying = (viewer: Viewer, playing: boolean): void => {
  // A live clock cannot pause: pausing leaves live.
  if (!playing) setLive(viewer, false);
  viewer.clock.shouldAnimate = playing;
  viewer.scene.requestRender();
};

export const setSpeed = (viewer: Viewer, speed: number, reversed: boolean): void => {
  setLive(viewer, false);
  viewer.clock.multiplier = reversed ? -speed : speed;
  viewer.clock.shouldAnimate = true;
  viewer.scene.requestRender();
};

export const scrubTo = (viewer: Viewer, ms: number): void => {
  setLive(viewer, false);
  viewer.clock.currentTime = JulianDate.fromDate(new Date(ms));
  viewer.scene.requestRender();
};

/** Calls `listener` at most every `intervalMs` while the clock ticks. */
export const onClockTick = (
  viewer: Viewer,
  listener: () => void,
  intervalMs = 100,
): (() => void) => {
  let last = 0;
  return viewer.clock.onTick.addEventListener(() => {
    const now = performance.now();
    if (now - last < intervalMs) return;
    last = now;
    listener();
  });
};

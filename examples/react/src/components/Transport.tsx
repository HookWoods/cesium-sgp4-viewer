import type { Viewer } from 'cesium';

import { type ClockState, setLive, setPlaying, setSpeed } from '../../../shared/clock';
import { formatUtc } from '../../../shared/format';
import { SPEEDS } from '../../../shared/timeline';

interface TransportProps {
  viewer: Viewer;
  clock: ClockState;
}

/** Play/pause, direction, speeds and the live button. */
export const Transport = ({ viewer, clock }: TransportProps) => (
  <div className="controls">
    <button
      type="button"
      title="Reverse"
      aria-pressed={clock.isReversed}
      onClick={() => setSpeed(viewer, clock.speed, !clock.isReversed)}
    >
      ◀◀
    </button>
    <button
      type="button"
      aria-label={clock.isPlaying ? 'Pause' : 'Play'}
      onClick={() => setPlaying(viewer, !clock.isPlaying)}
    >
      {clock.isPlaying ? '❚❚' : '▶'}
    </button>
    <div className="group" role="group" aria-label="Speed">
      {SPEEDS.map((speed) => (
        <button
          key={speed}
          type="button"
          aria-pressed={!clock.isLive && clock.speed === speed}
          onClick={() => setSpeed(viewer, speed, clock.isReversed)}
        >
          ×{speed}
        </button>
      ))}
    </div>
    <button type="button" aria-pressed={clock.isLive} onClick={() => setLive(viewer, true)}>
      Live
    </button>
    <output className="clock">{formatUtc(clock.ms)}</output>
  </div>
);

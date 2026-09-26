import type { Viewer } from 'cesium';

import { type ClockState, setLive, setPlaying, setSpeed } from '../../../shared/clock';
import { formatUtc } from '../../../shared/format';
import { SPEEDS } from '../../../shared/timeline';
import { byId } from './dom';

/** Play/pause, direction, speeds and the live button. */
export const mountTransport = (viewer: Viewer, getState: () => ClockState) => {
  const play = byId('play', HTMLButtonElement);
  const reverse = byId('reverse', HTMLButtonElement);
  const live = byId('live', HTMLButtonElement);
  const clock = byId('clock', HTMLOutputElement);
  const speeds = byId('speeds', HTMLDivElement);

  const speedButtons = SPEEDS.map((speed) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `×${speed}`;
    button.addEventListener('click', () => {
      setSpeed(viewer, speed, getState().isReversed);
      render();
    });
    speeds.append(button);
    return button;
  });

  play.addEventListener('click', () => {
    setPlaying(viewer, !getState().isPlaying);
    render();
  });
  reverse.addEventListener('click', () => {
    const state = getState();
    setSpeed(viewer, state.speed, !state.isReversed);
    render();
  });
  live.addEventListener('click', () => {
    setLive(viewer, true);
    render();
  });

  const render = () => {
    const state = getState();
    play.textContent = state.isPlaying ? '❚❚' : '▶';
    play.setAttribute('aria-label', state.isPlaying ? 'Pause' : 'Play');
    reverse.setAttribute('aria-pressed', String(state.isReversed));
    live.setAttribute('aria-pressed', String(state.isLive));
    SPEEDS.forEach((speed, i) => {
      speedButtons[i]!.setAttribute('aria-pressed', String(!state.isLive && state.speed === speed));
    });
    clock.textContent = formatUtc(state.ms);
  };

  return { render };
};

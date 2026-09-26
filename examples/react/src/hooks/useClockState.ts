import type { Viewer } from 'cesium';
import { useEffect, useState } from 'react';

import { type ClockState, onClockTick, readClock } from '../../../shared/clock';

/** The viewer's clock, re-read ten times a second while it ticks. */
export const useClockState = (viewer: Viewer | null): ClockState | null => {
  const [state, setState] = useState<ClockState | null>(null);

  useEffect(() => {
    if (!viewer) return;
    return onClockTick(viewer, () => setState(readClock(viewer)));
  }, [viewer]);

  return state;
};

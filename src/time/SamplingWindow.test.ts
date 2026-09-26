import { describe, expect, it } from 'vitest';

import { ringsNeedRebuild, SamplingWindow } from './SamplingWindow.js';

const HOUR = 3_600_000;

describe('SamplingWindow', () => {
  it('is centred on the playhead', () => {
    const window = SamplingWindow.around(10 * HOUR);
    expect(window.startMs).toBe(8 * HOUR);
    expect(window.stopMs).toBe(12 * HOUR);
    expect(window.centreMs).toBe(10 * HOUR);
  });

  it('asks to move near either edge, and beyond', () => {
    const window = SamplingWindow.around(10 * HOUR);
    expect(window.needsMove(10 * HOUR)).toBe(false);
    expect(window.needsMove(11.4 * HOUR)).toBe(false);
    expect(window.needsMove(11.6 * HOUR)).toBe(true);
    expect(window.needsMove(8.4 * HOUR)).toBe(true);
    expect(window.needsMove(20 * HOUR)).toBe(true);
    expect(window.contains(20 * HOUR)).toBe(false);
  });

  it('rejects a margin wider than the window', () => {
    expect(() => SamplingWindow.around(0, { halfWidthMs: HOUR, marginMs: 2 * HOUR })).toThrow(
      RangeError,
    );
  });
});

describe('ringsNeedRebuild', () => {
  it('rebuilds when there are none, or after an hour either way', () => {
    expect(ringsNeedRebuild(null, 0)).toBe(true);
    expect(ringsNeedRebuild(0, 0.5 * HOUR)).toBe(false);
    expect(ringsNeedRebuild(0, -HOUR)).toBe(true);
  });
});

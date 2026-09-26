import { type KeyboardEvent, type PointerEvent, useCallback, useRef, useState } from 'react';

import {
  formatTick,
  ticks,
  tickStep,
  TIMELINE_DEFAULT_SPAN_MS,
  zoomSpan,
} from '../../../shared/timeline';

const LABEL_BUDGET_PX = 110;
const HEIGHT = 44;

interface TimelineProps {
  ms: number;
  onScrub: (ms: number) => void;
}

/**
 * A time axis that scrolls under a fixed playhead. Drag to move through time,
 * wheel to zoom, arrow keys to step.
 */
export const Timeline = ({ ms, onScrub }: TimelineProps) => {
  const [spanMs, setSpanMs] = useState(TIMELINE_DEFAULT_SPAN_MS);
  const [width, setWidth] = useState(0);
  const drag = useRef<{ x: number; ms: number } | null>(null);

  // Measures the axis, and zooms on wheel (a non-passive listener, so the page does not scroll).
  const ref = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(element);
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setSpanMs((span) => zoomSpan(span, event.deltaY));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      observer.disconnect();
      element.removeEventListener('wheel', onWheel);
    };
  }, []);

  const step = tickStep(spanMs, Math.max(2, Math.floor(width / LABEL_BUDGET_PX)));
  const toX = (t: number) => ((t - (ms - spanMs / 2)) / spanMs) * width;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, ms };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || width === 0) return;
    // Dragging the axis right brings earlier times under the playhead.
    onScrub(drag.current.ms - ((event.clientX - drag.current.x) / width) * spanMs);
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: -step,
      ArrowRight: step,
      PageDown: -10 * step,
      PageUp: 10 * step,
    };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    onScrub(ms + move);
  };

  return (
    <div
      ref={ref}
      className="timeline"
      role="slider"
      tabIndex={0}
      aria-label="Time"
      aria-valuetext={new Date(ms).toISOString()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <svg>
        {ticks(ms, spanMs, step).map((t) => (
          <g key={t}>
            <line className="tick" x1={toX(t)} x2={toX(t)} y1={10} y2={18} />
            <text className="label" x={toX(t)} y={34}>
              {formatTick(t)}
            </text>
          </g>
        ))}
        <line className="playhead" x1={width / 2} x2={width / 2} y1={2} y2={HEIGHT - 2} />
      </svg>
    </div>
  );
};

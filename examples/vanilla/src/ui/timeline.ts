import {
  formatTick,
  ticks,
  tickStep,
  TIMELINE_DEFAULT_SPAN_MS,
  zoomSpan,
} from '../../../shared/timeline';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Horizontal room per label, so the gradation adapts to the width. */
const LABEL_BUDGET_PX = 110;

const svgElement = (name: string, attributes: Record<string, string | number>) => {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
};

/**
 * A time axis that scrolls under a fixed playhead. Drag to move through time,
 * wheel to zoom, arrow keys to step.
 */
export const mountTimeline = (container: HTMLElement, onScrub: (ms: number) => void) => {
  const svg = svgElement('svg', {});
  container.append(svg);
  container.tabIndex = 0;
  container.setAttribute('role', 'slider');
  container.setAttribute('aria-label', 'Time');

  let spanMs = TIMELINE_DEFAULT_SPAN_MS;
  let currentMs = 0;
  let drag: { x: number; ms: number } | null = null;

  const maxTicks = () => Math.max(2, Math.floor(container.clientWidth / LABEL_BUDGET_PX));

  const render = (ms: number) => {
    currentMs = ms;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const step = tickStep(spanMs, maxTicks());
    const toX = (t: number) => ((t - (ms - spanMs / 2)) / spanMs) * width;

    const children: SVGElement[] = [];
    for (const t of ticks(ms, spanMs, step)) {
      const x = toX(t);
      children.push(svgElement('line', { class: 'tick', x1: x, x2: x, y1: 10, y2: 18 }));
      children.push(svgElement('text', { class: 'label', x, y: 34 }));
      children[children.length - 1]!.textContent = formatTick(t);
    }
    children.push(
      svgElement('line', {
        class: 'playhead',
        x1: width / 2,
        x2: width / 2,
        y1: 2,
        y2: height - 2,
      }),
    );
    svg.replaceChildren(...children);
    container.setAttribute('aria-valuetext', new Date(ms).toISOString());
  };

  container.addEventListener('pointerdown', (event) => {
    container.setPointerCapture(event.pointerId);
    drag = { x: event.clientX, ms: currentMs };
  });
  container.addEventListener('pointermove', (event) => {
    if (!drag) return;
    // Dragging the axis right brings earlier times under the playhead.
    onScrub(drag.ms - ((event.clientX - drag.x) / container.clientWidth) * spanMs);
  });
  const endDrag = () => {
    drag = null;
  };
  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);

  container.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      spanMs = zoomSpan(spanMs, event.deltaY);
      render(currentMs);
    },
    { passive: false },
  );

  container.addEventListener('keydown', (event) => {
    const step = tickStep(spanMs, maxTicks());
    const moves: Record<string, number> = {
      ArrowLeft: -step,
      ArrowRight: step,
      PageDown: -10 * step,
      PageUp: 10 * step,
    };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    onScrub(currentMs + move);
  });

  return { render };
};

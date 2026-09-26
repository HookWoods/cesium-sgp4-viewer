import type { Satellite } from '@dsanchez31/cesium-sgp4-viewer';

import { describe, formatKm } from '../../../shared/format';

/** The selected satellite's elements, and its altitude now. */
export const mountDetails = (panel: HTMLElement, onClose: () => void) => {
  let altitude: HTMLElement | null = null;

  const show = (satellite: Satellite | null) => {
    panel.hidden = satellite === null;
    altitude = null;
    if (!satellite) {
      panel.replaceChildren();
      return;
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'close';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', onClose);

    const title = document.createElement('h2');
    title.textContent = satellite.name;

    const list = document.createElement('dl');
    const rows: [string, string][] = [...describe(satellite), ['Altitude', '…']];
    for (const [term, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = term;
      const dd = document.createElement('dd');
      dd.textContent = value;
      list.append(dt, dd);
      if (term === 'Altitude') altitude = dd;
    }
    panel.replaceChildren(close, title, list);
  };

  const setAltitude = (metres: number | undefined) => {
    if (altitude) altitude.textContent = metres === undefined ? 'n/a' : formatKm(metres);
  };

  return { show, setAltitude };
};

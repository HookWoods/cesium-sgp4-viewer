import {
  DEFAULT_REGIME_COLORS,
  ORBIT_REGIMES,
  type OrbitRegime,
} from '@dsanchez31/cesium-sgp4-viewer';

const NAMES: Record<OrbitRegime, string> = {
  LEO: 'Low Earth orbit',
  MEO: 'Medium Earth orbit',
  GEO: 'Geosynchronous orbit',
  HEO: 'Highly elliptical orbit',
};

/** One checkbox per regime, doubling as the colour legend. */
export const mountRegimes = (
  fieldset: HTMLFieldSetElement,
  onChange: (regimes: OrbitRegime[]) => void,
) => {
  const boxes = ORBIT_REGIMES.map((regime) => {
    const label = document.createElement('label');
    label.title = NAMES[regime];
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = true;
    box.value = regime;
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = DEFAULT_REGIME_COLORS[regime];
    label.append(box, swatch, regime);
    fieldset.append(label);
    return box;
  });

  fieldset.addEventListener('change', () => {
    onChange(boxes.filter((box) => box.checked).map((box) => box.value as OrbitRegime));
  });
};

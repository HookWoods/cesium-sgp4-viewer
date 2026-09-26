import type { Satellite } from '@dsanchez31/cesium-sgp4-viewer';

/** `2026-09-26 14:03:12 UTC` */
export const formatUtc = (ms: number): string =>
  `${new Date(ms).toISOString().slice(0, 19).replace('T', ' ')} UTC`;

export const formatKm = (metres: number): string =>
  `${Math.round(metres / 1000).toLocaleString('en-US')} km`;

/** The details shown for a selected satellite, as label/value pairs. */
export const describe = (satellite: Satellite): [string, string][] => {
  const e = satellite.elements;
  return [
    ['NORAD ID', satellite.noradId],
    ['Regime', satellite.regime],
    ['Epoch', formatUtc(e.epoch.getTime())],
    ['Inclination', `${e.inclinationDeg.toFixed(2)}°`],
    ['Eccentricity', e.eccentricity.toFixed(5)],
    ['Period', `${e.periodMinutes.toFixed(1)} min`],
    ['Perigee', formatKm(e.perigeeAltitudeM)],
    ['Apogee', formatKm(e.apogeeAltitudeM)],
  ];
};

/** Search by name (case-insensitive substring) or by NORAD ID prefix. */
export const searchPredicate = (query: string): ((satellite: Satellite) => boolean) | null => {
  const q = query.trim().toLowerCase();
  if (q === '') return null;
  return (satellite) => satellite.noradId.startsWith(q) || satellite.name.toLowerCase().includes(q);
};

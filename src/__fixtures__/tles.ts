/** Real element sets from a CelesTrak export, one per regime. */
export const ISS = {
  name: 'ISS (ZARYA)',
  line1: '1 25544U 98067A   26269.01266414  .00010261  00000+0  19655-3 0  9997',
  line2: '2 25544  51.6303 161.0895 0007829 186.0461 174.0434 15.48628597587381',
};

export const GPS = {
  name: 'NAVSTAR 43 (USA 132)',
  line1: '1 24876U 97035A   26268.91485289  .00000060  00000+0  00000+0 0  9995',
  line2: '2 24876  56.0534  94.6361 0106163  59.0663 302.0446  2.00564465213970',
};

export const INTELSAT = {
  name: 'INTELSAT 902 (IS-902)',
  line1: '1 26900U 01039A   26268.75590124 -.00000276  00000+0  00000+0 0  9991',
  line2: '2 26900   6.3650  70.5087 0003915 114.6853  41.4080  1.00271866 91707',
};

export const POLAR = {
  name: 'POLAR',
  line1: '1 23802U 96013A   26268.93925484  .00000117  00000+0  00000+0 0  9999',
  line2: '2 23802  80.0113 225.8418 6566233 205.5949  97.1375  1.29845792146162',
};

/** Formats fixtures the way CelesTrak does: names padded to 24 columns, CRLF. */
export const celestrakText = (...entries: { name: string; line1: string; line2: string }[]) =>
  entries
    .map(({ name, line1, line2 }) => `${name.padEnd(24)}\r\n${line1}\r\n${line2}\r\n`)
    .join('');

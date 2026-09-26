import { describe, expect, it } from 'vitest';

import { celestrakText, GPS, INTELSAT, ISS, POLAR } from '../__fixtures__/tles.js';
import { parseTle, parseTleCatalog, tleChecksum, TleParseError } from './parseCatalog.js';

describe('tleChecksum', () => {
  it('matches the checksum printed in column 69', () => {
    for (const line of [ISS.line1, ISS.line2, GPS.line1, GPS.line2]) {
      expect(tleChecksum(line)).toBe(Number(line[68]));
    }
  });
});

describe('parseTle', () => {
  it('reads identity and elements', () => {
    const satellite = parseTle(ISS.line1, ISS.line2, ISS.name);
    expect(satellite.noradId).toBe('25544');
    expect(satellite.name).toBe('ISS (ZARYA)');
    expect(satellite.regime).toBe('LEO');
    expect(satellite.elements.inclinationDeg).toBeCloseTo(51.6303, 4);
    expect(satellite.elements.periodMinutes).toBeGreaterThan(92);
    expect(satellite.elements.periodMinutes).toBeLessThan(94);
  });

  it('falls back on the catalog number when there is no name', () => {
    expect(parseTle(ISS.line1, ISS.line2).name).toBe('25544');
  });

  it('rejects a corrupted checksum unless asked not to verify it', () => {
    const corrupted = `${ISS.line1.slice(0, 68)}0`;
    expect(() => parseTle(corrupted, ISS.line2)).toThrow(TleParseError);
    expect(parseTle(corrupted, ISS.line2, 'ISS', { verifyChecksum: false }).noradId).toBe('25544');
  });

  it('rejects lines of two different objects', () => {
    expect(() => parseTle(ISS.line1, GPS.line2)).toThrow(/catalog numbers/);
  });

  it('rejects truncated lines', () => {
    expect(() => parseTle(ISS.line1.slice(0, 60), ISS.line2)).toThrow(/69/);
  });
});

describe('parseTleCatalog', () => {
  it('reads a CelesTrak export (padded names, CRLF)', () => {
    const { satellites, rejected } = parseTleCatalog(celestrakText(ISS, GPS, INTELSAT, POLAR));
    expect(rejected).toEqual([]);
    expect(satellites.map((s) => [s.name, s.regime])).toEqual([
      ['ISS (ZARYA)', 'LEO'],
      ['NAVSTAR 43 (USA 132)', 'MEO'],
      ['INTELSAT 902 (IS-902)', 'GEO'],
      ['POLAR', 'HEO'],
    ]);
  });

  it('reads the 3LE format with a "0 " name prefix', () => {
    const text = `0 ISS (ZARYA)\n${ISS.line1}\n${ISS.line2}\n`;
    expect(parseTleCatalog(text).satellites[0]?.name).toBe('ISS (ZARYA)');
  });

  it('reads bare 2-line sets', () => {
    const text = [ISS.line1, ISS.line2, GPS.line1, GPS.line2].join('\n');
    expect(parseTleCatalog(text).satellites.map((s) => s.name)).toEqual(['25544', '24876']);
  });

  it('reports what it could not read, and keeps going', () => {
    const text = [
      'ORPHAN NAME',
      'ISS (ZARYA)',
      `${ISS.line1.slice(0, 68)}0`,
      ISS.line2,
      GPS.line2,
      'GPS',
      GPS.line1,
      GPS.line2,
    ].join('\n');
    const { satellites, rejected } = parseTleCatalog(text);
    expect(satellites.map((s) => s.noradId)).toEqual(['24876']);
    expect(rejected).toEqual([
      { line: 1, reason: 'name line is not followed by an element set' },
      { line: 2, reason: 'line 1 fails its checksum' },
      { line: 5, reason: 'line 2 has no matching line' },
    ]);
  });
});

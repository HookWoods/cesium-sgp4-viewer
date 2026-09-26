import type { SatRec } from 'satellite.js';

import {
  DEGREES_PER_RADIAN,
  EARTH_EQUATORIAL_RADIUS,
  EARTH_MU,
  fromJulianDate,
  MINUTES_PER_DAY,
} from '../constants.js';

/**
 * Mean orbital elements of a TLE, in SI units and degrees.
 *
 * These are SGP4 mean elements, not osculating ones: altitudes derived from
 * them are good to a few kilometres, which is plenty to classify or describe an
 * orbit. Propagate when you need a position.
 */
export interface OrbitalElements {
  /** Epoch of the element set. */
  epoch: Date;
  inclinationDeg: number;
  /** Right ascension of the ascending node. */
  raanDeg: number;
  eccentricity: number;
  argumentOfPerigeeDeg: number;
  meanAnomalyDeg: number;
  /** Mean motion used by SGP4 (Brouwer), in revolutions per day. */
  meanMotionRevPerDay: number;
  periodMinutes: number;
  semiMajorAxisM: number;
  /** Above the equatorial radius. */
  perigeeAltitudeM: number;
  /** Above the equatorial radius. */
  apogeeAltitudeM: number;
  /** SGP4 drag term, in inverse Earth radii. */
  bstar: number;
}

/** Reads the mean elements satellite.js parsed from the TLE. */
export const orbitalElements = (satrec: SatRec): OrbitalElements => {
  // `no` is in radians per minute; Kepler's third law wants radians per second.
  const meanMotionRadPerSecond = satrec.no / 60;
  const semiMajorAxisM = Math.cbrt(EARTH_MU / meanMotionRadPerSecond ** 2);

  return {
    epoch: new Date(fromJulianDate(satrec.jdsatepoch)),
    inclinationDeg: satrec.inclo * DEGREES_PER_RADIAN,
    raanDeg: satrec.nodeo * DEGREES_PER_RADIAN,
    eccentricity: satrec.ecco,
    argumentOfPerigeeDeg: satrec.argpo * DEGREES_PER_RADIAN,
    meanAnomalyDeg: satrec.mo * DEGREES_PER_RADIAN,
    meanMotionRevPerDay: (satrec.no * MINUTES_PER_DAY) / (2 * Math.PI),
    periodMinutes: (2 * Math.PI) / satrec.no,
    semiMajorAxisM,
    perigeeAltitudeM: semiMajorAxisM * (1 - satrec.ecco) - EARTH_EQUATORIAL_RADIUS,
    apogeeAltitudeM: semiMajorAxisM * (1 + satrec.ecco) - EARTH_EQUATORIAL_RADIUS,
    bstar: satrec.bstar,
  };
};

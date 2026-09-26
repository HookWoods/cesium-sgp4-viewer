import type { OrbitalElements } from './elements.js';

/**
 * Coarse orbit classes. The order is part of the API: a regime's index in this
 * array is its numeric code in the propagation workers.
 */
export const ORBIT_REGIMES = ['LEO', 'MEO', 'GEO', 'HEO'] as const;

export type OrbitRegime = (typeof ORBIT_REGIMES)[number];

/** Highly elliptical from this eccentricity on, whatever the altitude. */
const HEO_MIN_ECCENTRICITY = 0.25;

/** Low Earth orbit: the whole orbit stays below 2,000 km. */
const LEO_MAX_APOGEE_ALTITUDE_M = 2_000_000;

/**
 * Geosynchronous: about one revolution per sidereal day, nearly circular. The
 * band is wide enough to keep drifting and graveyard objects in the belt.
 */
const GEO_MEAN_MOTION_REV_PER_DAY = { min: 0.9, max: 1.1 } as const;
const GEO_MAX_ECCENTRICITY = 0.1;

/**
 * Classifies an orbit.
 *
 * Eccentricity decides first: a Molniya orbit reaches GEO altitudes at apogee
 * and LEO ones at perigee, and is neither. Everything left between LEO and the
 * geosynchronous band is MEO.
 */
export const classifyRegime = (
  elements: Pick<OrbitalElements, 'eccentricity' | 'apogeeAltitudeM' | 'meanMotionRevPerDay'>,
): OrbitRegime => {
  const { eccentricity, apogeeAltitudeM, meanMotionRevPerDay } = elements;

  if (eccentricity >= HEO_MIN_ECCENTRICITY) return 'HEO';
  if (apogeeAltitudeM < LEO_MAX_APOGEE_ALTITUDE_M) return 'LEO';
  if (
    eccentricity < GEO_MAX_ECCENTRICITY &&
    meanMotionRevPerDay >= GEO_MEAN_MOTION_REV_PER_DAY.min &&
    meanMotionRevPerDay <= GEO_MEAN_MOTION_REV_PER_DAY.max
  ) {
    return 'GEO';
  }
  return 'MEO';
};

/** The regime's numeric code, as the workers and the orbit primitive use it. */
export const regimeCode = (regime: OrbitRegime): number => ORBIT_REGIMES.indexOf(regime);

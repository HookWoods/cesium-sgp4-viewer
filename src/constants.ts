/** Earth's gravitational parameter (WGS-84), m³/s². */
export const EARTH_MU = 3.986004418e14;

/** WGS-84 equatorial radius, metres. */
export const EARTH_EQUATORIAL_RADIUS = 6_378_137;

/** Mean rotation rate of the Earth relative to the stars, rad/s. */
export const EARTH_ROTATION_RATE = 7.292115146706979e-5;

export const MS_PER_SECOND = 1_000;
export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;
export const MINUTES_PER_DAY = 1_440;

/** Julian date of 1970-01-01T00:00:00Z. */
export const UNIX_EPOCH_JULIAN_DATE = 2_440_587.5;

export const DEGREES_PER_RADIAN = 180 / Math.PI;

/** Unix time in milliseconds to a Julian date (UTC). */
export const toJulianDate = (ms: number): number => ms / MS_PER_DAY + UNIX_EPOCH_JULIAN_DATE;

/** Julian date (UTC) to Unix time in milliseconds. */
export const fromJulianDate = (jd: number): number => (jd - UNIX_EPOCH_JULIAN_DATE) * MS_PER_DAY;

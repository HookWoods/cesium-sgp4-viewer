import { type SatRec, SatRecError, twoline2satrec } from 'satellite.js';

import { type OrbitalElements, orbitalElements } from '../orbit/elements.js';
import { classifyRegime, type OrbitRegime } from '../orbit/regime.js';

/** One propagable object of a catalog. */
export interface Satellite {
  /** Catalog number as printed in the TLE (5 characters, Alpha-5 included), without padding. */
  readonly noradId: string;
  /** Name line of a 3-line set, or the catalog number when the set had none. */
  readonly name: string;
  readonly line1: string;
  readonly line2: string;
  readonly satrec: SatRec;
  readonly elements: OrbitalElements;
  readonly regime: OrbitRegime;
}

/** A set of lines that could not be turned into a {@link Satellite}. */
export interface RejectedTle {
  /** 1-based line number of the first line of the set in the input text. */
  line: number;
  reason: string;
}

export interface TleCatalog {
  satellites: Satellite[];
  rejected: RejectedTle[];
}

export interface ParseOptions {
  /**
   * Verify the modulo-10 checksum in column 69 of each line. On by default:
   * a wrong checksum usually means a line was edited or truncated.
   */
  verifyChecksum?: boolean;
}

export class TleParseError extends Error {
  override name = 'TleParseError';
}

const TLE_LINE_LENGTH = 69;

/** Modulo-10 sum of the digits of the first 68 columns, where a minus sign counts as 1. */
export const tleChecksum = (line: string): number => {
  let sum = 0;
  for (let i = 0; i < TLE_LINE_LENGTH - 1; i++) {
    const char = line.charCodeAt(i);
    if (char >= 48 && char <= 57) sum += char - 48;
    else if (char === 45) sum += 1;
  }
  return sum % 10;
};

const checkLine = (line: string, number: '1' | '2', verifyChecksum: boolean): void => {
  if (line.length < TLE_LINE_LENGTH) {
    throw new TleParseError(`line ${number} is ${line.length} characters long, expected 69`);
  }
  if (!line.startsWith(`${number} `)) {
    throw new TleParseError(`line ${number} does not start with "${number} "`);
  }
  if (verifyChecksum && Number(line[TLE_LINE_LENGTH - 1]) !== tleChecksum(line)) {
    throw new TleParseError(`line ${number} fails its checksum`);
  }
};

/**
 * Parses one element set.
 *
 * @throws {TleParseError} when the lines are malformed or do not describe an
 * orbit SGP4 can propagate.
 */
export const parseTle = (
  line1: string,
  line2: string,
  name?: string,
  { verifyChecksum = true }: ParseOptions = {},
): Satellite => {
  const first = line1.trimEnd();
  const second = line2.trimEnd();
  checkLine(first, '1', verifyChecksum);
  checkLine(second, '2', verifyChecksum);

  const noradId = first.slice(2, 7).trim();
  if (noradId !== second.slice(2, 7).trim()) {
    throw new TleParseError('lines 1 and 2 carry different catalog numbers');
  }

  const satrec = twoline2satrec(first, second);
  // satellite.js accepts some malformed lines silently and leaves NaN fields
  // behind, so the mean motion is checked as well as the error code.
  if (satrec.error !== SatRecError.None || !(satrec.no > 0) || !Number.isFinite(satrec.no)) {
    throw new TleParseError('the element set does not describe a propagable orbit');
  }

  const elements = orbitalElements(satrec);
  const trimmedName = name?.trim() ?? '';
  return {
    noradId,
    name: trimmedName === '' ? noradId : trimmedName,
    line1: first,
    line2: second,
    satrec,
    elements,
    regime: classifyRegime(elements),
  };
};

/**
 * Parses a text of element sets, in 2-line or 3-line form, the way CelesTrak
 * and Space-Track serve them. A name line may carry the `0 ` prefix of the 3LE
 * format. Blank lines are ignored and CRLF line endings are accepted.
 *
 * Nothing is thrown: every set that fails is reported in `rejected`, so a
 * caller can tell its users how complete the picture is.
 */
export const parseTleCatalog = (text: string, options: ParseOptions = {}): TleCatalog => {
  const lines = text.split(/\r?\n/);
  const satellites: Satellite[] = [];
  const rejected: RejectedTle[] = [];
  let name: string | undefined;
  let nameLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trimEnd();
    if (line.trim() === '') continue;

    if (line.startsWith('1 ') && lines[i + 1]?.startsWith('2 ')) {
      const firstLine = name === undefined ? i + 1 : nameLine;
      try {
        satellites.push(parseTle(line, lines[i + 1]!, name, options));
      } catch (error) {
        rejected.push({ line: firstLine, reason: (error as Error).message });
      }
      name = undefined;
      i++;
      continue;
    }

    if (line.startsWith('1 ') || line.startsWith('2 ')) {
      rejected.push({ line: i + 1, reason: `line ${line[0]!} has no matching line` });
      name = undefined;
      continue;
    }

    if (name !== undefined) {
      rejected.push({ line: nameLine, reason: 'name line is not followed by an element set' });
    }
    name = line.startsWith('0 ') ? line.slice(2) : line;
    nameLine = i + 1;
  }

  if (name !== undefined) {
    rejected.push({ line: nameLine, reason: 'name line is not followed by an element set' });
  }

  return { satellites, rejected };
};

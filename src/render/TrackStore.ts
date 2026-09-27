import { interpolateSamples } from '../sampling/interpolate.js';
import type { Vector3 } from '../sgp4/propagate.js';
import type { Shard, ShardResult } from '../worker/pool.js';

/**
 * The latest samples of the whole catalog, as the workers sent them, read by
 * catalog index.
 *
 * A satellite is a slice of its shard's buffer: no per-sample object is ever
 * created, and replacing the samples after a window move is one assignment per
 * shard.
 */
export class TrackStore {
  private results: (ShardResult | undefined)[];
  private readonly shardOf: Uint16Array;
  private readonly shardStart: Uint32Array;

  constructor(shards: readonly Shard[], size: number) {
    this.results = shards.map(() => undefined);
    this.shardOf = new Uint16Array(size);
    this.shardStart = new Uint32Array(shards.length);
    shards.forEach((shard, s) => {
      this.shardStart[s] = shard.start;
      this.shardOf.fill(s, shard.start, shard.start + shard.size);
    });
  }

  update(results: readonly ShardResult[]): void {
    // The rings go to the GPU: keeping them here would keep their vertices too.
    this.results = results.map((result) => ({ ...result, rings: null }));
  }

  /** Whether satellite `i` has samples over the current window. */
  isPropagated(i: number): boolean {
    const s = this.shardOf[i]!;
    const result = this.results[s];
    return result !== undefined && result.counts[i - this.shardStart[s]!]! > 0;
  }

  /** How many satellites have no samples over the current window. */
  failedCount(): number {
    let failed = 0;
    for (const result of this.results) {
      if (!result) continue;
      for (const count of result.counts) if (count === 0) failed++;
    }
    return failed;
  }

  /** Earth-fixed position of satellite `i` at `ms`, or `null` outside its samples. */
  positionAt(i: number, ms: number, out: Vector3): Vector3 | null {
    const s = this.shardOf[i]!;
    const result = this.results[s];
    if (!result) return null;
    const j = i - this.shardStart[s]!;
    const count = result.counts[j]!;
    if (count === 0) return null;
    return interpolateSamples(
      result.positions,
      result.offsets[j]!,
      count,
      result.firstMs[j]!,
      result.stepMs[j]!,
      ms,
      out,
    );
  }
}

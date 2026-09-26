/** A minimal typed event emitter: `on` returns the function that unsubscribes. */
export class Emitter<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<(value: never) => void>>();

  on<K extends keyof Events>(event: K, listener: (value: Events[K]) => void): () => void {
    const set = this.listeners.get(event) ?? new Set<(value: never) => void>();
    this.listeners.set(event, set);
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  emit<K extends keyof Events>(event: K, value: Events[K]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      try {
        (listener as (value: Events[K]) => void)(value);
      } catch (error) {
        // One failing listener must not starve the others, nor the render loop.
        console.error(`[cesium-sgp4-viewer] "${String(event)}" listener failed`, error);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

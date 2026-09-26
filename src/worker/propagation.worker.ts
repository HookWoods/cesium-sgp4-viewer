import { type FromWorker, type ToWorker, transferablesOf } from './protocol.js';
import { ShardSampler } from './sampler.js';

/** The dedicated worker scope, typed without pulling the WebWorker lib into the DOM build. */
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ToWorker>) => void) | null;
  postMessage(message: FromWorker, transfer?: Transferable[]): void;
};

let sampler: ShardSampler | null = null;

scope.onmessage = ({ data: message }) => {
  try {
    if (message.type === 'load') {
      sampler = new ShardSampler(message.tles);
      return;
    }

    if (!sampler) throw new Error('sample requested before any catalog was loaded');
    const result = sampler.sample(message.requestId, message.startMs, message.stopMs);
    if (message.ringEpochMs !== null) result.rings = sampler.rings(message.ringEpochMs);
    scope.postMessage(result, transferablesOf(result));
  } catch (error) {
    // Always answer, so the caller's promise settles instead of hanging.
    scope.postMessage({
      type: 'error',
      requestId: message.type === 'sample' ? message.requestId : null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

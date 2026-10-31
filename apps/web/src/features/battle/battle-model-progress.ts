/** The Unit Model files of the Battle that the loading screen waits for. */
interface ModelProgress {
  readonly done: number;
  readonly total: number;
}

let total = 0;
let done = 0;
let snapshot: ModelProgress | null = null;
const listeners = new Set<() => void>();

const publish = () => {
  snapshot = total === 0 ? null : { done, total };
  for (const listener of listeners) {
    listener();
  }
};

/** The progress of the Unit Model preload, or `null` when no preload runs. */
export const modelProgress = {
  begin(count: number) {
    total = count;
    done = 0;
    publish();
  },
  step() {
    done += 1;
    publish();
  },
  end() {
    total = 0;
    done = 0;
    publish();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: (): ModelProgress | null => snapshot,
};

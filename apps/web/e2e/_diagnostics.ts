/**
 * The read-only Battle diagnostics that the E2E build installs on `window`.
 * The Battle bot playtest and the browser matrix both read them.
 */

export interface Diagnostics {
  readonly state: {
    readonly mode: string;
    readonly turnNumber?: number;
    readonly units?: number;
    readonly playerHp?: number;
    readonly enemyHp?: number;
    readonly queued?: number;
    readonly current?: string | null;
    readonly result?: {
      readonly winner: string;
      readonly reason: string;
    } | null;
    readonly eventsPlayed?: number;
    readonly hand?: readonly number[];
    readonly tutorial?: {
      readonly shown: readonly string[];
      readonly done: readonly string[];
    } | null;
  };
  readonly renderer: {
    readonly render: { readonly calls: number; readonly triangles: number };
  };
  readonly frames: { readonly fps: number; readonly frameMs: number };
  readonly targetPoints: () => readonly {
    readonly x: number;
    readonly y: number;
  }[];
  readonly unitPoints: () => readonly UnitPoint[];
}

export interface UnitPoint {
  readonly id: number;
  readonly owner: "player" | "enemy";
  readonly x: number;
  readonly y: number;
}

declare global {
  interface Window {
    __THREE_GAME_DIAGNOSTICS__?: Diagnostics;
  }
}

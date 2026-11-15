// How a live room talks. One small interface, so the engine does not care whether messages travel
// between two browser tabs (local.ts, used for tests) or through LiveKit data messages (sprint 2).
import type { Snapshot } from '../engine/reducer'

export type Msg =
  | { t: 'state'; s: Snapshot }
  | { t: 'answer'; tool: string; done: number; value: number }
  | { t: 'pin'; x: number; y: number }
  | { t: 'pace'; which: 'stay' | 'move' }
  | { t: 'hello' }

export interface Transport {
  /** unique per participant */
  id: string
  send: (m: Msg) => void
  subscribe: (cb: (m: Msg, from: string) => void) => () => void
  close: () => void
}

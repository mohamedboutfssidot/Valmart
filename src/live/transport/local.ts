// Same-origin transport: BroadcastChannel carries the messages between tabs of one browser.
// Used to test the host-authority logic with two windows and no network.
import type { Msg, Transport } from './types'

const uid = () => Math.random().toString(36).slice(2, 10)

export function createLocalTransport(room: string): Transport {
  const id = uid()
  if (typeof BroadcastChannel === 'undefined') {
    return { id, send: () => undefined, subscribe: () => () => undefined, close: () => undefined }
  }
  const ch = new BroadcastChannel(`valmart-room-${room}`)
  return {
    id,
    send: (m: Msg) => ch.postMessage({ from: id, m }),
    subscribe: (cb) => {
      const on = (ev: MessageEvent<{ from: string; m: Msg }>) => { if (ev.data?.from !== id) cb(ev.data.m, ev.data.from) }
      ch.addEventListener('message', on)
      return () => ch.removeEventListener('message', on)
    },
    close: () => ch.close(),
  }
}

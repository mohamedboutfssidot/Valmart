import type { Transport } from '../live/transport/types'

export type RoomRole = 'host' | 'control' | 'camera' | 'moderator' | 'viewer'

/** What a host announces when going live; shown in the list of lives. */
export interface LiveMeta { title: string; city: string; country: string; category: string; host: string }
export interface LiveNow extends LiveMeta { room: string; viewers: number; at: number; thumb?: string }

export interface Person { identity: string; name: string; role: RoomRole; self: boolean }
export interface ChatItem { id: string; user: string; text: string; role: RoomRole; self: boolean }

export interface RoomInfo {
  status: 'connecting' | 'connected' | 'ended' | 'error'
  error?: string
  people: Person[]
  /** Number of viewers (not counting the team). */
  viewers: number
  /** A host or a camera is in the room. */
  publisherHere: boolean
  /** A live video track is arriving from the host or camera. */
  streaming: boolean
  /** The camera is paused. */
  paused: boolean
  /** The host or camera feed (video and sound) as seen from this device. */
  remote: MediaStream | null
  /** This device's own camera preview, while publishing. */
  local: MediaStream | null
  /** Title, place and host of this live (set when the host created the room). */
  meta?: LiveMeta | null
}

export const emptyInfo: RoomInfo = { status: 'connecting', people: [], viewers: 0, publisherHere: false, streaming: false, paused: false, remote: null, local: null, meta: null }

/** What a room connection gives the screens. LiveKit in production, a browser-only version for tests. */
export interface Backend {
  identity: string
  transport: Transport
  info: () => RoomInfo
  onInfo: (cb: (i: RoomInfo) => void) => () => void
  sendChat: (text: string) => void
  onChat: (cb: (c: ChatItem) => void) => () => void
  publish: (o: { video: boolean; audio: boolean; facing?: 'user' | 'environment' }) => Promise<void>
  setPaused: (p: boolean) => Promise<void>
  flip: () => Promise<void>
  leave: () => void
}

export interface Session { token: string; url: string; identity: string; room: string; role: RoomRole; name: string }

export const roleOfIdentity = (id: string): RoomRole => {
  const r = id.split('-')[0]
  return r === 'host' || r === 'control' || r === 'camera' || r === 'moderator' ? r : 'viewer'
}

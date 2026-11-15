// LiveKit connection: video and sound from the host or camera, tool messages and chat as data packets.
// Data topics: "tool" (tool state, answers, pins, pace) and "chat". State is sent lossy (a fresh one comes every second),
// everything else reliable.
import { ConnectionState, Room, RoomEvent, Track, VideoPresets, type LocalVideoTrack, type Participant, type RemoteParticipant } from 'livekit-client'
import { parseMeta } from '../../rooms/api'
import { emptyInfo, roleOfIdentity, type Backend, type ChatItem, type Person, type RoomInfo, type Session } from '../../rooms/types'
import type { Msg, Transport } from './types'

const enc = new TextEncoder()
const dec = new TextDecoder()
const AUTHORITY = ['host', 'control']
const PUBLISHER = ['host', 'camera']

export async function connectLiveKit(s: Session): Promise<Backend> {
  const room = new Room({ adaptiveStream: true, dynacast: true })
  let info: RoomInfo = { ...emptyInfo }
  const infoCbs = new Set<(i: RoomInfo) => void>()
  const chatCbs = new Set<(c: ChatItem) => void>()
  const toolCbs = new Set<(m: Msg, from: string) => void>()
  let remoteStream: MediaStream | null = null
  let remoteKey = ''
  let localStream: MediaStream | null = null
  let localKey = ''

  const person = (p: Participant, self: boolean): Person => ({ identity: p.identity, name: p.name || p.identity, role: roleOfIdentity(p.identity), self })

  const recompute = () => {
    const remotes = [...room.remoteParticipants.values()]
    const people = [person(room.localParticipant, true), ...remotes.map((p) => person(p, false))]
    // the feed: the newest video and sound track among hosts and cameras
    const tracks: MediaStreamTrack[] = []
    let paused = false
    let video = false
    for (const p of remotes) {
      if (!PUBLISHER.includes(roleOfIdentity(p.identity))) continue
      for (const pub of p.trackPublications.values()) {
        if (!pub.isSubscribed || !pub.track) continue
        tracks.push(pub.track.mediaStreamTrack)
        if (pub.kind === Track.Kind.Video) { video = true; if (pub.isMuted) paused = true }
      }
    }
    const key = tracks.map((t) => t.id).join('|')
    if (key !== remoteKey) { remoteKey = key; remoteStream = tracks.length ? new MediaStream(tracks) : null }
    const lp = room.localParticipant
    const cam = lp.getTrackPublication(Track.Source.Camera)
    const mic = lp.getTrackPublication(Track.Source.Microphone)
    const lt = [cam?.track?.mediaStreamTrack, mic?.track?.mediaStreamTrack].filter((t): t is MediaStreamTrack => !!t)
    const lkey = lt.map((t) => t.id).join('|')
    if (lkey !== localKey) { localKey = lkey; localStream = lt.length ? new MediaStream(lt.filter((t) => t.kind === 'video')) : null }
    const connected = room.state === ConnectionState.Connected
    info = {
      ...info,
      status: info.status === 'ended' || info.status === 'error' ? info.status : connected ? 'connected' : 'connecting',
      people,
      viewers: people.filter((p) => p.role === 'viewer').length,
      publisherHere: people.some((p) => PUBLISHER.includes(p.role)),
      streaming: video,
      paused: paused || (!!cam && cam.isMuted && PUBLISHER.includes(roleOfIdentity(lp.identity))),
      remote: remoteStream,
      local: localStream,
      meta: parseMeta(room.metadata),
    }
    infoCbs.forEach((cb) => cb(info))
  }

  room.on(RoomEvent.RoomMetadataChanged, recompute)
  room.on(RoomEvent.ParticipantConnected, recompute)
  room.on(RoomEvent.ParticipantDisconnected, recompute)
  room.on(RoomEvent.TrackSubscribed, recompute)
  room.on(RoomEvent.TrackUnsubscribed, recompute)
  room.on(RoomEvent.TrackMuted, recompute)
  room.on(RoomEvent.TrackUnmuted, recompute)
  room.on(RoomEvent.LocalTrackPublished, recompute)
  room.on(RoomEvent.LocalTrackUnpublished, recompute)
  room.on(RoomEvent.Reconnecting, recompute)
  room.on(RoomEvent.Reconnected, recompute)
  room.on(RoomEvent.Disconnected, () => { info = { ...info, status: 'ended', remote: null, streaming: false }; infoCbs.forEach((cb) => cb(info)) })
  room.on(RoomEvent.DataReceived, (payload: Uint8Array, p?: RemoteParticipant, _kind?: unknown, topic?: string) => {
    if (!p) return
    let data: unknown
    try { data = JSON.parse(dec.decode(payload)) } catch { return }
    const role = roleOfIdentity(p.identity)
    if (topic === 'tool') {
      const m = data as Msg
      if (m.t === 'state' && !AUTHORITY.includes(role)) return // only the host or control room can set the state
      toolCbs.forEach((cb) => cb(m, p.identity))
    } else if (topic === 'chat') {
      const d = data as { id?: string; text?: string }
      if (typeof d.text !== 'string' || !d.text) return
      chatCbs.forEach((cb) => cb({ id: d.id ?? `${p.identity}-${Date.now()}`, user: p.name || 'Guest', text: d.text!.slice(0, 300), role, self: false }))
    }
  })

  await room.connect(s.url, s.token)
  recompute()

  const send = (topic: 'tool' | 'chat', obj: unknown, reliable: boolean) => {
    const bytes = enc.encode(JSON.stringify(obj))
    void room.localParticipant.publishData(bytes, { reliable: reliable || bytes.length > 1000, topic }).catch(() => undefined)
  }

  const transport: Transport = {
    id: s.identity,
    send: (m) => send('tool', m, m.t !== 'state'),
    subscribe: (cb) => { toolCbs.add(cb); return () => { toolCbs.delete(cb) } },
    close: () => undefined,
  }

  const facingRef = { v: 'user' as 'user' | 'environment' }
  return {
    identity: s.identity,
    transport,
    info: () => info,
    onInfo: (cb) => { infoCbs.add(cb); return () => { infoCbs.delete(cb) } },
    sendChat: (text) => {
      const id = `${s.identity}-${Date.now()}`
      send('chat', { id, text }, true)
      chatCbs.forEach((cb) => cb({ id, user: s.name, text, role: s.role, self: true }))
    },
    onChat: (cb) => { chatCbs.add(cb); return () => { chatCbs.delete(cb) } },
    publish: async ({ video, audio, facing }) => {
      facingRef.v = facing ?? 'user'
      const lp = room.localParticipant
      let problem = ''
      if (video) {
        // try a light picture first, then no constraint at all (some webcams are slow or refuse a size)
        const tries = [{ facingMode: facingRef.v, resolution: VideoPresets.h540.resolution }, { facingMode: facingRef.v }, {}]
        let lastErr: unknown = null
        for (const o of tries) {
          try { await lp.setCameraEnabled(true, o); lastErr = null; break }
          catch (e) { lastErr = e; try { await lp.setCameraEnabled(false) } catch { /* nothing to stop */ } }
        }
        if (lastErr) {
          const m = String((lastErr as Error)?.message ?? lastErr)
          problem = /denied|permission|notallowed/i.test(m)
            ? 'The camera is blocked. Click the camera icon in the address bar, allow it, then tap Retry camera.'
            : 'The camera did not start. Close other apps or tabs that use the camera (Zoom, Teams, Camera, another browser), then tap Retry camera.'
        }
      }
      if (audio) { try { await lp.setMicrophoneEnabled(true) } catch { problem = problem || 'The microphone did not start. Allow it in the address bar, then tap Retry camera.' } }
      recompute()
      if (problem) throw new Error(problem)
    },
    setPaused: async (p) => {
      await room.localParticipant.setCameraEnabled(!p, { facingMode: facingRef.v, resolution: VideoPresets.h720.resolution })
      await room.localParticipant.setMicrophoneEnabled(!p)
      recompute()
    },
    flip: async () => {
      const track = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalVideoTrack | undefined
      if (!track) return
      facingRef.v = facingRef.v === 'user' ? 'environment' : 'user'
      await track.restartTrack({ facingMode: facingRef.v })
      recompute()
    },
    leave: () => { void room.disconnect() },
  }
}

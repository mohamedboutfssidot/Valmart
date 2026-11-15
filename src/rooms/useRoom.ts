import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Msg as ChatMsg } from '../hooks/useLiveSim'
import { getSession } from './api'
import { emptyInfo, type Backend, type RoomInfo, type RoomRole } from './types'

export interface RoomOpts { room: string; role: RoomRole; key?: string; name: string }

/**
 * One hook for every room screen. Nothing connects until `join()` is called from a tap
 * (browsers need a tap for camera and sound).
 */
export function useRoom(o: RoomOpts) {
  const [info, setInfo] = useState<RoomInfo>({ ...emptyInfo, status: 'ended' })
  const [phase, setPhase] = useState<'idle' | 'joining' | 'in' | 'error'>('idle')
  const [error, setError] = useState('')
  const [chat, setChat] = useState<ChatMsg[]>([])
  const be = useRef<Backend | null>(null)
  const [backend, setBackend] = useState<Backend | null>(null)
  const alive = useRef(true)
  const n = useRef(0)

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false; be.current?.leave(); be.current = null }
  }, [])

  const join = useCallback(async () => {
    if (be.current) return
    setPhase('joining'); setError('')
    try {
      const s = await getSession(o.room, o.role, o.key, o.name)
      const b = s.url === 'local'
        ? (await import('../live/transport/roomLocal')).connectLocalRoom(s)
        : await (await import('../live/transport/livekit')).connectLiveKit(s)
      if (!alive.current) { b.leave(); return }
      be.current = b
      b.onInfo((i) => {
        if (!alive.current || be.current !== b) return
        if (i.status === 'ended') { be.current = null; setBackend(null); setError('The connection was lost. Tap the button to reconnect.'); setPhase('error'); return }
        setInfo(i)
      })
      b.onChat((c) => alive.current && setChat((m) => [...m.slice(-199), {
        id: ++n.current, kind: c.role === 'host' || c.role === 'control' || c.role === 'camera' ? 'host' : 'chat', user: c.user, text: c.text,
      }]))
      setInfo(b.info())
      setBackend(b)
      setPhase('in')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join the room')
      setPhase('error')
    }
  }, [o.room, o.role, o.key, o.name])

  const leave = useCallback(() => { be.current?.leave(); be.current = null; setBackend(null); setPhase('idle'); setInfo({ ...emptyInfo, status: 'ended' }) }, [])
  const sendChat = useCallback((t: string) => { const x = t.trim().slice(0, 300); if (x) be.current?.sendChat(x) }, [])
  const publish = useCallback((p: { video: boolean; audio: boolean; facing?: 'user' | 'environment' }) => be.current?.publish(p) ?? Promise.resolve(), [])
  const setPaused = useCallback((p: boolean) => be.current?.setPaused(p) ?? Promise.resolve(), [])
  const flip = useCallback(() => be.current?.flip() ?? Promise.resolve(), [])
  const net = useMemo(() => backend?.transport ?? null, [backend])

  return { phase, error, info, net, chat, join, leave, sendChat, publish, setPaused, flip }
}
export type RoomApi = ReturnType<typeof useRoom>

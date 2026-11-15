// Small shared pieces for the real-room screens. They use no router, so web pages and the mobile app both reuse them.
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { STREAMS, type Stream } from '../data/mock'
import type { RoomInfo } from './types'

export const field = 'w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none'
export const primary = 'rounded-pill bg-sun px-6 py-3 font-display text-base font-bold text-ink-950 hover:bg-sun-soft active:scale-[.98] disabled:opacity-60'
export const ghost = 'rounded-pill border border-line px-4 py-2 text-sm font-semibold hover:border-sky active:scale-[.98]'

export const roomStream = (room: string): Stream => ({
  id: 'host-room', cityId: STREAMS[0].cityId, hostId: STREAMS[0].hostId, title: 'Live room', place: room,
  category: 'Discovery', viewers: 0, startedMinAgo: 0, language: 'English', art: STREAMS[0].art,
})

export function useCopy() {
  const [done, setDone] = useState('')
  return [done, (key: string, text: string) => {
    try { void navigator.clipboard?.writeText(text) } catch { /* clipboard blocked */ }
    setDone(key)
    window.setTimeout(() => setDone(''), 1600)
  }] as const
}

export function Qr({ text, size = 120 }: { text: string; size?: number }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toDataURL(text, { margin: 1, width: size * 2, color: { dark: '#06121f', light: '#ffffff' } }).then((u) => live && setUrl(u)).catch(() => undefined)
    return () => { live = false }
  }, [text, size])
  return url ? <img src={url} width={size} height={size} alt="QR code of the link" className="rounded-lg bg-white p-1" /> : <span style={{ width: size, height: size }} className="block rounded-lg bg-ink-700" />
}

/** Message shown over the video while there is no picture yet. */
export function VideoNotice({ info, role, code }: { info: RoomInfo; role: 'viewer' | 'control'; code?: string }) {
  const [late, setLate] = useState(false)
  useEffect(() => { const t = window.setTimeout(() => setLate(true), 8000); return () => window.clearTimeout(t) }, [])
  let text = ''
  if (info.status === 'ended') text = 'The connection ended.'
  else if (info.status === 'connecting') text = 'Connecting…'
  else if (info.paused) text = role === 'viewer' ? 'The host paused the camera for a moment.' : 'The camera is paused.'
  else if (!info.publisherHere) text = role === 'viewer' ? (late && code ? `No live yet with the code ${code}. Check the code, or wait for the host.` : 'Waiting for the host to start…') : 'Waiting for the camera…'
  else if (!info.streaming) text = 'Connecting to the video…'
  if (!text) return null
  return <span className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center bg-ink-950/60 px-6 text-center"><span className="rounded-pill bg-ink-950/90 px-5 py-2.5 font-display text-base font-bold">{text}</span></span>
}

export function ErrorLine({ text }: { text: string }) {
  return text ? <p role="alert" className="rounded-xl border border-[color:var(--danger,#ff6b6b)] bg-ink-900 px-3.5 py-2.5 text-sm">{text}</p> : null
}

/** Keeps the phone screen on while filming (a sleeping screen cuts the camera). Silent where unsupported. */
export function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on) return
    type Lock = { release: () => Promise<void> }
    let lock: Lock | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Lock> } }
    const get = async () => { try { lock = (await nav.wakeLock?.request('screen')) ?? null } catch { /* not allowed */ } }
    void get()
    const vis = () => { if (document.visibilityState === 'visible') void get() }
    document.addEventListener('visibilitychange', vis)
    return () => { document.removeEventListener('visibilitychange', vis); void lock?.release().catch(() => undefined) }
  }, [on])
}

/** Guesses "the host is walking fast" from the phone's movement (Android, or iPhone once motion is allowed). */
export function useMotionWalking(enabled: boolean) {
  const [walking, setWalking] = useState(false)
  useEffect(() => {
    if (!enabled || typeof DeviceMotionEvent === 'undefined') return
    const buf: number[] = []
    let last = 0
    const on = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (!a || a.x == null || a.y == null || a.z == null) return
      buf.push(Math.hypot(a.x, a.y, a.z))
      if (buf.length > 40) buf.shift()
      const now = Date.now()
      if (now - last < 500 || buf.length < 20) return
      last = now
      const mean = buf.reduce((x, y) => x + y, 0) / buf.length
      const sd = Math.sqrt(buf.reduce((x, y) => x + (y - mean) ** 2, 0) / buf.length)
      setWalking(sd > 2.2)
    }
    window.addEventListener('devicemotion', on)
    return () => window.removeEventListener('devicemotion', on)
  }, [enabled])
  return walking
}

/** iPhone asks for motion access from a tap. Call this first thing in the tap handler. */
export async function askMotion() {
  const D = (typeof DeviceMotionEvent === 'undefined' ? null : DeviceMotionEvent) as unknown as { requestPermission?: () => Promise<string> } | null
  try { await D?.requestPermission?.() } catch { /* refused: the manual switch still works */ }
}

// A still picture of a live, shown on its card before anyone opens it.
// The host's device takes a small JPEG of its own camera every few seconds. Viewers in the same browser read it at once;
// the room service can also keep it for other devices (sent to /thumb and returned by /live as `thumb`, when supported).
import { useEffect, useState } from 'react'

const key = (room: string) => `valmart.thumb.${room}`
const read = (room: string) => { try { return localStorage.getItem(key(room)) } catch { return null } }

/** Draws the current frame of a stream to a small JPEG (data URL), or null if no picture is available yet. */
export async function captureThumb(stream: MediaStream, w = 480): Promise<string | null> {
  const t = stream.getVideoTracks()[0]
  if (!t || t.readyState !== 'live') return null
  const v = document.createElement('video')
  v.muted = true; v.playsInline = true; v.srcObject = stream
  try {
    await v.play()
    for (let i = 0; i < 20 && !v.videoWidth; i++) await new Promise((r) => setTimeout(r, 100))
    if (!v.videoWidth) return null
    const c = document.createElement('canvas')
    c.width = w; c.height = Math.round((w * v.videoHeight) / v.videoWidth)
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.6)
  } catch { return null } finally { v.pause(); v.srcObject = null }
}

export function saveThumb(room: string, data: string) {
  try { localStorage.setItem(key(room), data); window.dispatchEvent(new CustomEvent('vm-thumb', { detail: room })) } catch { /* storage full or blocked */ }
}

/** Host side: refresh the still while the camera is on. */
export function useThumbPublisher(room: string, feed: MediaStream | null, push?: (data: string) => void) {
  useEffect(() => {
    if (!feed) return
    let on = true
    const run = async () => { const d = await captureThumb(feed); if (on && d) { saveThumb(room, d); push?.(d) } }
    const first = window.setTimeout(run, 2500)
    const t = window.setInterval(run, 12000)
    return () => { on = false; window.clearTimeout(first); window.clearInterval(t) }
  }, [room, feed]) // eslint-disable-line react-hooks/exhaustive-deps
}

/** Viewer side: the latest still of a live (from this browser, or the one the service returned). */
export function useThumb(room: string, fromService?: string) {
  const [d, setD] = useState<string | null>(() => read(room))
  useEffect(() => {
    setD(read(room))
    const on = (e: Event) => { if ((e as CustomEvent).detail === room) setD(read(room)) }
    const st = (e: StorageEvent) => { if (e.key === key(room)) setD(e.newValue) }
    window.addEventListener('vm-thumb', on); window.addEventListener('storage', st)
    return () => { window.removeEventListener('vm-thumb', on); window.removeEventListener('storage', st) }
  }, [room])
  return d ?? fromService ?? null
}

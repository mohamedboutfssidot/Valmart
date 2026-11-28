// A silent preview of a real live: joins the room as a viewer while the card is on screen, shows the host's video muted,
// and leaves when the card scrolls away. Nothing is said or sent.
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useRoom } from './useRoom'

/** `box` is the element to watch for visibility. Returns the live video (or null until it arrives). */
export function usePreviewStream(room: string, box: RefObject<Element | null>, enabled = true): MediaStream | null {
  const [seen, setSeen] = useState(false)
  const r = useRoom({ room, role: 'viewer', name: 'Preview' })
  const started = useRef(false)
  useEffect(() => {
    const el = box.current
    if (!enabled || !el) return
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => setSeen(!!e?.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [box, enabled])
  useEffect(() => {
    if (enabled && seen && !started.current) { started.current = true; void r.join() }
    if ((!seen || !enabled) && started.current) { started.current = false; r.leave() }
  }, [seen, enabled, r])
  return r.phase === 'in' ? r.info.remote : null
}

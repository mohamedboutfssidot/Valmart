import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Fullscreen on a portrait phone: the content is turned 90° so the live is horizontal. */
export function Landscape({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const turn = box.h > box.w
  return (
    <div ref={ref} className="absolute inset-0 z-50 overflow-hidden bg-black" data-testid="m-landscape" data-turned={turn}>
      <div className="absolute left-0 top-0" style={turn ? { width: box.h, height: box.w, transform: `translateX(${box.w}px) rotate(90deg)`, transformOrigin: 'top left' } : { width: '100%', height: '100%' }}>
        <div className="relative h-full w-full">{children}</div>
      </div>
    </div>
  )
}

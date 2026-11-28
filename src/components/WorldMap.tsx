import { useMemo, useState } from 'react'
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { CITIES, STREAMS } from '../data/mock'

const W = 1000
const H = 520

// Built once at load: land shapes (without Antarctica) and the projection fitted to them.
const land = (() => {
  const all = feature(world as any, (world as any).objects.countries) as any
  return { type: 'FeatureCollection', features: all.features.filter((f: any) => String(f.id) !== '010') } as any
})()
const projection = geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], land)
const path = geoPath(projection)
const landPath = path(land) ?? ''
const gridPath = path(geoGraticule10()) ?? ''

const pins = CITIES.map((c) => {
  const [x, y] = projection([c.lon, c.lat]) ?? [0, 0]
  const live = STREAMS.filter((s) => s.cityId === c.id)
  const viewers = live.reduce((n, s) => n + s.viewers, 0)
  return { city: c, x, y, live: live.length, viewers }
})

export function WorldMap({ selected, onSelect }: { selected: string | null; onSelect: (id: string | null) => void }) {
  const [hover, setHover] = useState<string | null>(null)
  const active = hover ?? selected
  const activePin = useMemo(() => pins.find((p) => p.city.id === active), [active])

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-line bg-ink-950">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label="World map of live sessions">
        <path d={gridPath} fill="none" stroke="var(--ink-700)" strokeWidth="0.5" opacity="0.5" />
        <path d={landPath} fill="var(--ink-700)" stroke="var(--ink-900)" strokeWidth="0.6" />
        {pins.map((p) => {
          const r = 5 + p.live * 1.6
          const on = p.city.id === selected
          return (
            <g
              key={p.city.id}
              tabIndex={0}
              role="button"
              aria-pressed={on}
              aria-label={`${p.city.name}, ${p.live} live`}
              className="cursor-pointer outline-none"
              onClick={() => onSelect(on ? null : p.city.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(on ? null : p.city.id) } }}
              onMouseEnter={() => setHover(p.city.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(p.city.id)}
              onBlur={() => setHover(null)}
            >
              <circle cx={p.x} cy={p.y} r={26} fill="transparent" />
              <circle className="map-ring" cx={p.x} cy={p.y} r={r} fill="var(--sun)" opacity="0.35" />
              <circle cx={p.x} cy={p.y} r={r} fill="var(--sun)" stroke={on ? 'var(--sky)' : 'var(--ink-950)'} strokeWidth={on ? 3.5 : 2} />
            </g>
          )
        })}
      </svg>

      {activePin && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-line bg-ink-900/95 px-3 py-2 text-sm shadow-lg"
          style={{
            left: `${Math.min(88, Math.max(12, (activePin.x / W) * 100))}%`,
            top: `${(activePin.y / H) * 100}%`,
            transform: `translate(-50%, calc(-100% - 18px))`,
          }}
        >
          <p className="whitespace-nowrap font-display font-semibold">{activePin.city.name}</p>
          <p className="whitespace-nowrap text-fg-muted">{activePin.live} live, {activePin.viewers.toLocaleString('en-US')} watching</p>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-ink-900/85 px-3 py-1.5 text-xs text-fg-muted">
        <span className="h-2.5 w-2.5 rounded-full bg-sun" /> City with live sessions
      </div>
    </div>
  )
}

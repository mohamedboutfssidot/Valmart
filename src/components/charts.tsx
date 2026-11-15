import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}K` : String(Math.round(n)))

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(640)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function niceMax(v: number) {
  if (!(v > 0)) return 1
  const pow = 10 ** Math.floor(Math.log10(v))
  const n = v / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

export interface Point { label: string; value: number }

/** Card with a title, a subtitle that says what is plotted, and a chart/table switch. */
export function ChartCard({ title, subtitle, rows, unit, children }: {
  title: string; subtitle: string; rows: Point[]; unit: string; children: ReactNode
}) {
  const [table, setTable] = useState(false)
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-ink-800 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <p className="text-sm text-fg-muted">{subtitle}</p>
        </div>
        <button type="button" onClick={() => setTable((t) => !t)} aria-pressed={table} className="shrink-0 rounded-pill border border-line px-3 py-1 text-xs hover:bg-ink-700">
          {table ? 'View chart' : 'View as table'}
        </button>
      </div>
      {table ? (
        <div className="max-h-[300px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-fg-muted"><tr><th className="py-1.5 font-medium">{unit === 'Impressions' ? 'Day' : 'Item'}</th><th className="py-1.5 text-right font-medium">{unit}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-line"><td className="py-1.5">{r.label}</td><td className="py-1.5 text-right tabular-nums">{r.value.toLocaleString('en-US')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : children}
    </section>
  )
}

export function LineChart({ data, unit }: { data: Point[]; unit: string }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const H = 240
  const m = { l: 44, r: 16, t: 12, b: 28 }
  const iw = w - m.l - m.r
  const ih = H - m.t - m.b
  const max = useMemo(() => niceMax(Math.max(...data.map((d) => d.value))), [data])
  const x = (i: number) => m.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw)
  const y = (v: number) => m.t + ih - (v / max) * ih
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1)},${m.t + ih} L${x(0)},${m.t + ih} Z`
  const ticks = [0, 1, 2, 3, 4].map((k) => (max / 4) * k)
  const every = Math.ceil(data.length / Math.max(2, Math.floor(iw / 70)))
  const last = data.length - 1
  const idx = hover ?? last

  const onMove = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left - m.l
    setHover(Math.min(last, Math.max(0, Math.round((px / iw) * last))))
  }

  return (
    <div ref={ref} className="relative">
      <svg
        width={w} height={H} role="img" tabIndex={0}
        aria-label={`${unit} per day. Latest ${data[last].value.toLocaleString('en-US')}.`}
        onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setHover(Math.max(0, idx - 1))
          if (e.key === 'ArrowRight') setHover(Math.min(last, idx + 1))
        }}
        onBlur={() => setHover(null)}
        className="block touch-pan-y"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={m.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--fg-muted)">{compact(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (i % every === 0 ? <text key={d.label} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--fg-muted)">{d.label}</text> : null))}
        <path d={area} fill="var(--sky)" opacity="0.10" />
        <path d={line} fill="none" stroke="var(--sky)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && <line x1={x(idx)} x2={x(idx)} y1={m.t} y2={m.t + ih} stroke="var(--fg-muted)" strokeWidth="1" />}
        <circle cx={x(idx)} cy={y(data[idx].value)} r="5" fill="var(--sky)" stroke="var(--ink-800)" strokeWidth="2" />
      </svg>
      <div
        className="pointer-events-none absolute z-10 rounded-xl border border-line bg-ink-900 px-3 py-2 text-sm shadow-lg"
        style={{ left: Math.min(w - 140, Math.max(0, x(idx) - 60)), top: 0 }}
      >
        <p className="font-display text-base font-bold tabular-nums">{data[idx].value.toLocaleString('en-US')}</p>
        <p className="flex items-center gap-2 text-fg-muted"><span className="inline-block h-0.5 w-3 rounded" style={{ background: 'var(--sky)' }} />{unit}, {data[idx].label}</p>
      </div>
    </div>
  )
}

export function BarList({ rows, unit, total }: { rows: Point[]; unit: string; total: number }) {
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <li key={r.label} className="group relative flex min-w-0 items-center gap-3 rounded-lg py-1 outline-none focus-visible:bg-ink-700 hover:bg-ink-700/60" tabIndex={0} aria-label={`${r.label}, ${r.value.toLocaleString('en-US')} ${unit}`}>
          <span className="w-[104px] shrink-0 truncate text-sm">{r.label}</span>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="bar-grow block h-4 rounded-r-[4px]" style={{ width: `calc((100% - 56px) * ${Math.max(0.02, r.value / max)})`, background: 'var(--sky)' }} />
            <span className="shrink-0 text-sm tabular-nums text-fg-muted">{compact(r.value)}</span>
          </span>
          <span className="pointer-events-none absolute -top-9 right-2 z-10 hidden rounded-xl border border-line bg-ink-900 px-3 py-1.5 text-sm shadow-lg group-hover:block group-focus-visible:block">
            <b className="tabular-nums">{r.value.toLocaleString('en-US')}</b> <span className="text-fg-muted">{unit}, {Math.round((r.value / total) * 100)}% of total</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

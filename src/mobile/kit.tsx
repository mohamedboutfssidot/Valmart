import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './icons'

export function useAnimatedNumber(target: number, ms = 900) {
  const [v, setV] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    const a = from.current; const t0 = performance.now(); let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3)
      setV(a + (target - a) * e)
      if (k < 1) raf = requestAnimationFrame(step); else from.current = target
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors duration-300 ${on ? 'bg-sky' : 'bg-ink-700'}`}>
      <span className="absolute left-[3px] top-[3px] h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)]" style={{ transform: on ? 'translateX(22px)' : 'none' }} />
    </button>
  )
}

export function Seg<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label?: string }) {
  const i = Math.max(0, options.indexOf(value))
  return (
    <div className="relative grid rounded-full border border-line p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }} role="tablist" aria-label={label}>
      <span className="absolute bottom-1 left-1 top-1 rounded-full bg-sky transition-transform duration-300 [transition-timing-function:cubic-bezier(.3,1.2,.5,1)]" style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${i * 100}%)` }} />
      {options.map((o) => (
        <button key={o} type="button" role="tab" aria-selected={o === value} onClick={() => onChange(o)} className={`relative z-10 rounded-full py-2 text-sm font-semibold transition-colors duration-300 ${o === value ? 'text-ink-950' : 'text-fg-muted'}`}>{o}</button>
      ))}
    </div>
  )
}

export function Group({ title, children, note }: { title?: string; children: ReactNode; note?: string }) {
  return (
    <section className="flex flex-col gap-2">
      {title && <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">{title}</h2>}
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink-900">{children}</div>
      {note && <p className="px-1 text-xs text-fg-muted">{note}</p>}
    </section>
  )
}

export function Item({ label, detail, right, onClick, tone }: { label: string; detail?: string; right?: ReactNode; onClick?: () => void; tone?: 'danger' }) {
  const body = (
    <>
      <span className="min-w-0 flex-1 text-left"><span className={`block text-[15px] font-medium ${tone === 'danger' ? 'text-sun-soft' : ''}`}>{label}</span>{detail && <span className="mt-0.5 block text-[13px] leading-snug text-fg-muted">{detail}</span>}</span>
      {right}
      {onClick && !right && <span className="rotate-180 text-fg-muted"><Icon name="back" size={18} /></span>}
    </>
  )
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5'
  return onClick ? <button type="button" onClick={onClick} className={`${cls} transition-colors active:bg-ink-800`}>{body}</button> : <div className={cls}>{body}</div>
}

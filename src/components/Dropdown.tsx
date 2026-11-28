// A dropdown list for forms: icon, hint and group per option, optional search, keyboard friendly.
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { CaretDown, Check, MagnifyingGlass } from '@phosphor-icons/react'

export interface Opt<T extends string> { value: T; label: string; hint?: string; icon?: ReactNode; group?: string }

export function Dropdown<T extends string>({ label, value, options, onChange, searchable = false, placeholder = 'Choose', testId }: {
  label: string; value: T; options: Opt<T>[]; onChange: (v: T) => void; searchable?: boolean; placeholder?: string; testId?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const id = useId()
  const cur = options.find((o) => o.value === value)
  const list = useMemo(() => options.filter((o) => !q || `${o.label} ${o.hint ?? ''} ${o.group ?? ''}`.toLowerCase().includes(q.toLowerCase())), [options, q])
  useEffect(() => {
    if (!open) return
    const out = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', out)
    return () => document.removeEventListener('mousedown', out)
  }, [open])
  const pick = (o: Opt<T>) => { onChange(o.value); setOpen(false); setQ('') }
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((n) => Math.min(list.length - 1, n + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((n) => Math.max(0, n - 1)) }
    else if (e.key === 'Enter' && open && list[hi]) { e.preventDefault(); pick(list[hi]) }
  }
  let lastGroup = ''
  return (
    <div className="relative flex min-w-0 flex-col gap-2" ref={box} onKeyDown={key}>
      <span id={`${id}-l`} className="text-sm font-medium">{label}</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l`} data-testid={testId} onClick={() => { setOpen((v) => !v); setHi(Math.max(0, options.findIndex((o) => o.value === value))) }} className="flex min-h-[48px] w-full items-center gap-3 rounded-xl border border-line bg-ink-900 px-3.5 py-2 text-left hover:border-sky focus:border-sky focus:outline-none">
        {cur?.icon && <span className="shrink-0 text-sky">{cur.icon}</span>}
        <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{cur?.label ?? placeholder}</span>{cur?.hint && <span className="block truncate text-xs text-fg-muted">{cur.hint}</span>}</span>
        <CaretDown size={16} className={`shrink-0 text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 flex max-h-[340px] flex-col overflow-hidden rounded-xl border border-line bg-ink-800 shadow-[0_12px_32px_rgba(0,0,0,.45)]">
          {searchable && (
            <label className="relative border-b border-line p-2">
              <span className="sr-only">Search</span>
              <MagnifyingGlass size={16} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
              <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setHi(0) }} placeholder="Search" className="h-9 w-full rounded-lg bg-ink-900 pl-8 pr-3 text-sm placeholder:text-fg-muted focus:outline-none" />
            </label>
          )}
          <ul role="listbox" aria-labelledby={`${id}-l`} className="overflow-y-auto p-1">
            {!list.length && <li className="px-3 py-3 text-sm text-fg-muted">Nothing matches.</li>}
            {list.map((o, n) => {
              const head = o.group && o.group !== lastGroup ? o.group : null
              if (o.group) lastGroup = o.group
              return (
                <li key={o.value} role="presentation">
                  {head && <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{head}</p>}
                  <button type="button" role="option" aria-selected={o.value === value} onMouseEnter={() => setHi(n)} onClick={() => pick(o)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${n === hi ? 'bg-ink-700' : ''}`}>
                    {o.icon && <span className={`shrink-0 ${o.value === value ? 'text-sky' : 'text-fg-muted'}`}>{o.icon}</span>}
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{o.label}</span>{o.hint && <span className="block text-xs leading-snug text-fg-muted">{o.hint}</span>}</span>
                    {o.value === value && <Check size={16} className="shrink-0 text-sky" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

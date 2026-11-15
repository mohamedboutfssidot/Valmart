// Small building blocks for the interactive public pages: tabs, one-open lists, segmented controls. No boxes of text.
import { useState, type ReactNode } from 'react'

export function Band({ title, hint, children, id }: { eyebrow?: string; title: string; hint?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-8">
      <header className="flex max-w-[62ch] flex-col gap-2"><h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>{hint && <p className="text-lg text-fg-muted">{hint}</p>}</header>
      {children}
    </section>
  )
}

export function Seg<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex max-w-full gap-6 overflow-x-auto border-b border-line">
      {options.map((o) => <button key={o} role="tab" type="button" aria-selected={o === value} onClick={() => onChange(o)} className={`-mb-px shrink-0 border-b-2 py-2.5 text-[15px] font-semibold transition-colors ${o === value ? 'border-sky-deep text-fg' : 'border-transparent text-fg-muted hover:text-fg'}`}>{o}</button>)}
    </div>
  )
}

/** Text rows, one open at a time. Click a row to read it. */
export function Rows({ items, first = 0 }: { items: { title: string; body: string }[]; first?: number | null }) {
  const [open, setOpen] = useState<number | null>(first)
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((it, i) => (
        <li key={it.title}>
          <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
            <span className={`text-[17px] font-semibold sm:text-lg ${open === i ? 'text-fg' : 'text-fg-muted'}`}>{it.title}</span>
            <span className={`shrink-0 text-2xl leading-none text-sky-deep transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
          </button>
          <div className={`grid transition-[grid-template-rows] duration-300 ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><p className="pb-4 pr-8 text-fg-muted">{it.body}</p></div></div>
        </li>
      ))}
    </ul>
  )
}

/** Left: a list of choices. Right: a working sample of the one selected. */
export function Explorer({ items }: { items: { tag: string; title: string; line: string; demo: ReactNode }[] }) {
  const [i, setI] = useState(0)
  const cur = items[i]
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12" data-testid="explorer">
      <div role="tablist" aria-label="Choose a feature" aria-orientation="vertical" className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line lg:flex-col lg:gap-0 lg:border-b-0 lg:border-l">
        {items.map((it, k) => (
          <button key={it.tag} role="tab" type="button" aria-selected={k === i} onClick={() => setI(k)} data-testid={`tab-${k}`} className={`-mb-px shrink-0 border-b-2 py-2.5 text-left text-[17px] font-semibold transition-colors lg:mb-0 lg:-ml-px lg:border-b-0 lg:border-l-2 lg:py-2.5 lg:pl-4 ${k === i ? 'border-sky-deep text-fg' : 'border-transparent text-fg-muted hover:text-fg'}`}>{it.tag}</button>
        ))}
      </div>
      <div key={cur.tag} className="fade-in grid min-w-0 gap-6 md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] md:items-start">
        <div><h3 className="text-2xl font-semibold leading-snug">{cur.title}</h3><p className="mt-2 text-fg-muted">{cur.line}</p></div>
        <div className="rounded-card border border-line bg-ink-800 p-5">{cur.demo}</div>
      </div>
    </div>
  )
}

export const Check = ({ on }: { on: boolean }) => <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${on ? 'bg-sky-deep text-white' : 'border border-line text-fg-muted'}`} aria-label={on ? 'Yes' : 'No'}>{on ? '✓' : '–'}</span>

import { useState, type ReactNode } from 'react'
import { useDemo } from '../store'
import { useExtra } from '../extra'

export const field = 'w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none'
export const primary = 'inline-flex items-center justify-center rounded-full bg-sun px-5 py-2.5 font-display text-sm font-bold text-ink-950 hover:bg-sun-soft disabled:opacity-60'
export const ghost = 'inline-flex items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-sky disabled:opacity-60'
export const card = 'min-w-0 rounded-card border border-line bg-ink-800 p-5'

export const Head = ({ title, sub }: { title: string; sub?: string }) => (
  <header className="flex max-w-[70ch] flex-col gap-1"><h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="text-fg-muted">{sub}</p>}</header>
)
export const Block = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-3" aria-label={title}><div><h2 className="font-display text-xl font-bold">{title}</h2>{hint && <p className="text-sm text-fg-muted">{hint}</p>}</div>{children}</section>
)
export const Empty = ({ children }: { children: ReactNode }) => <p className="rounded-card border border-dashed border-line p-4 text-sm text-fg-muted">{children}</p>
export const Stars = ({ n }: { n: number }) => <span className="text-sun" aria-label={`${n.toFixed(1)} out of 5`}>{'★'.repeat(Math.round(n))}<span className="text-line">{'★'.repeat(5 - Math.round(n))}</span></span>
export const Pill = ({ children, tone = 'sky' }: { children: ReactNode; tone?: 'sky' | 'sun' | 'ok' }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone === 'sun' ? 'bg-sun text-ink-950' : tone === 'ok' ? 'border border-line text-[color:var(--ok)]' : 'bg-sky/20 text-sky'}`}>{children}</span>
)
export const day = (d: string) => { const t = new Date(`${d}T12:00:00`); return Number.isNaN(+t) ? d : t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }

/** Small "Report" control: sends a report to the Safety queue (demo). */
export function ReportButton({ kind, target, className = '' }: { kind: 'chat' | 'host' | 'request' | 'live'; target: string; className?: string }) {
  const user = useDemo((s) => s.user)
  const report = useExtra((s) => s.report)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('Disrespectful or unsafe')
  const [sent, setSent] = useState(false)
  if (sent) return <span className={`text-xs text-fg-muted ${className}`} role="status">Thank you. The team will review it.</span>
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-xs text-fg-muted underline hover:text-fg" data-testid="report-open">Report</button>
      {open && (
        <>
          <select aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-lg border border-line bg-ink-900 px-2 py-1 text-xs">
            {['Disrespectful or unsafe', 'Not suitable for children', 'Spam or scam', 'Misleading location or content', 'Other'].map((r) => <option key={r}>{r}</option>)}
          </select>
          <button type="button" className="rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink-950" data-testid="report-send" onClick={() => { report({ kind, target, reason, by: user?.name ?? 'Guest' }); setSent(true) }}>Send</button>
        </>
      )}
    </span>
  )
}

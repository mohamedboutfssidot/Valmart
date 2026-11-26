import { useEffect, useRef, useState } from 'react'
import { Gesture, GiftArt } from '../live/theme'
import { GIFTS, type Gift } from '../data/live'
import type { Msg } from '../hooks/useLiveSim'
import { useDemo } from '../store'
import { planOf } from '../data/plans'

const POLL_IDEAS = [['What next?', 'Left', 'Right'], ['Eat here?', 'Yes', 'Skip'], ['Go inside?', 'Yes', 'Not yet']]
interface PollState { q: string; a: string; b: string; va: number; vb: number; mine: 0 | 1 | 2; left: number }

const NAME_COLORS = ['var(--n1)', 'var(--n2)', 'var(--n3)', 'var(--n4)', 'var(--n5)', 'var(--n6)']
const colorFor = (name: string) => NAME_COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % NAME_COLORS.length]

function Row({ m }: { m: Msg }) {
  if (m.kind === 'system') return <li className="px-2 py-1 text-center text-[13px] text-fg-muted">{m.text}</li>
  if (m.kind === 'gift' && m.gift) {
    return (
      <li className="flex items-center gap-2 rounded-xl bg-sun/12 px-3 py-2 text-[14px]" style={{ background: 'rgba(250,143,28,.12)' }}>
        <GiftArt id={m.gift.id} size={26} />
        <span className="min-w-0"><b style={{ color: colorFor(m.user) }}>{m.user}</b> {m.text} <span className="text-fg-muted">{m.gift.cost} coins</span></span>
      </li>
    )
  }
  return (
    <li className={`px-2 py-0.5 text-[14.5px] leading-snug ${m.kind === 'host' ? 'rounded-xl bg-sky/10 py-2' : ''}`} style={m.kind === 'host' ? { background: 'rgba(36,177,244,.12)' } : undefined}>
      <b style={{ color: m.kind === 'host' ? 'var(--sky)' : colorFor(m.user) }}>{m.user}</b>
      {m.kind === 'host' && <span className="ml-1.5 rounded-pill bg-sky px-1.5 py-px text-[10px] font-bold text-ink-950">Host</span>}
      {m.from && <span className="ml-1.5 text-xs text-fg-muted">{m.from}</span>}
      <span className="ml-2 break-words">{m.text}</span>
    </li>
  )
}

export function ChatPanel({ msgs, onSend, selfName, onGift, coins, className = '', placeholder = 'Send a message', locked: lockedIn = 0, off = false }: {
  msgs: Msg[]; onSend: (t: string) => void; selfName: string
  onGift?: (g: Gift) => string | null; coins?: number; className?: string; placeholder?: string; locked?: number; off?: boolean
}) {
  const locked = off ? 1 : lockedIn
  const list = useRef<HTMLUListElement>(null)
  const [text, setText] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const [giftOpen, setGiftOpen] = useState(false)
  const [tab, setTab] = useState<'gift' | 'poll'>('gift')
  const plan = useDemo((st) => st.plan)
  const maxPolls = planOf(plan).polls
  const [used, setUsed] = useState(0)
  const [poll, setPoll] = useState<PollState | null>(null)
  const [idea, setIdea] = useState(0)

  useEffect(() => {
    if (!poll || poll.left <= 0) return
    const t = setInterval(() => setPoll((p) => p && (p.left <= 1 ? null : { ...p, left: p.left - 1, va: p.va + (Math.random() < 0.5 ? 1 : 0), vb: p.vb + (Math.random() < 0.4 ? 1 : 0) })), 1000)
    return () => clearInterval(t)
  }, [poll?.q, poll === null])
  const startPoll = () => {
    if (poll || used >= maxPolls) return
    const [q, a, b] = POLL_IDEAS[idea]
    setPoll({ q, a, b, va: 2, vb: 1, mine: 0, left: 45 }); setUsed((n) => n + 1); setGiftOpen(false)
  }
  const vote = (n: 1 | 2) => setPoll((p) => p && p.mine === 0 ? { ...p, mine: n, va: p.va + (n === 1 ? 1 : 0), vb: p.vb + (n === 2 ? 1 : 0) } : p)

  useEffect(() => {
    const el = list.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs.length])

  return (
    <section className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-card border border-line bg-ink-800 ${className}`} aria-label="Live chat">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-display text-base font-semibold">Live chat</h2>
        <span className="text-xs text-fg-muted">Chatting as {selfName}</span>
      </div>
      <ul ref={list} className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-2 py-3" aria-live="polite">
        {msgs.map((m) => <Row key={m.id} m={m} />)}
      </ul>

      {poll && (
        <div className="fade-in mx-3 mb-2 rounded-xl border border-line bg-ink-900 p-3" data-testid="poll-card">
          <div className="mb-2 flex items-center justify-between text-xs text-fg-muted"><b className="text-fg">Poll · {poll.q}</b><span className="tabular-nums">{poll.left}s</span></div>
          <div className="grid grid-cols-2 gap-2">
            {([[1, poll.a, poll.va], [2, poll.b, poll.vb]] as const).map(([n, label, v]) => {
              const tot = poll.va + poll.vb
              return <button key={n} type="button" disabled={poll.mine !== 0} onClick={() => vote(n)} className={`lt-btn relative overflow-hidden ${poll.mine === n ? 'is-on' : ''}`}>{poll.mine !== 0 && <span className="lt-fill" style={{ width: `${Math.round((v / tot) * 100)}%` }} />}<span className="relative">{label}{poll.mine !== 0 && ` ${Math.round((v / tot) * 100)}%`}</span></button>
            })}
          </div>
        </div>
      )}

      {onGift && giftOpen && tab === 'poll' && (
        <div className="fade-in border-t border-line px-3 pt-3" data-testid="poll-tray">
          <div className="mb-2 flex items-center justify-between text-xs text-fg-muted">
            <span>Ask the other viewers</span>
            <button type="button" onClick={() => setGiftOpen(false)} className="font-semibold text-fg hover:underline">Close</button>
          </div>
          {maxPolls === 0 ? (
            <p className="pb-3 text-sm text-fg-muted">Polls start with Plus (1 per live) and Premium (3 per live). <a href="#/app/plan" className="font-semibold text-sky-deep underline">See plans</a></p>
          ) : (
            <div className="pb-3">
              <div className="mb-2 flex flex-wrap gap-2">{POLL_IDEAS.map((x, i) => <button key={x[0]} type="button" aria-pressed={idea === i} onClick={() => setIdea(i)} className="lt-btn">{x[0]}</button>)}</div>
              <button type="button" disabled={!!poll || used >= maxPolls} onClick={startPoll} className="lt-btn is-on disabled:opacity-40" data-testid="poll-start">Start poll</button>
              <span className="ml-3 text-xs text-fg-muted">{maxPolls - used} left this live</span>
            </div>
          )}
        </div>
      )}

      {onGift && giftOpen && tab === 'gift' && (
        <div className="fade-in border-t border-line px-3 pt-3" data-testid="gift-tray">
          <div className="mb-2 flex items-center justify-between text-xs text-fg-muted">
            <span>Send a gift to the host</span>
            <span className="flex items-center gap-3"><span className="tabular-nums">{coins} demo coins</span><button type="button" onClick={() => setGiftOpen(false)} className="font-semibold text-fg hover:underline">Close</button></span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {GIFTS.map((g) => (
              <button
                key={g.id}
                type="button"
                disabled={coins !== undefined && coins < g.cost}
                onClick={() => { const r = onGift(g); setNote(r); if (r && r.startsWith('Sent')) setGiftOpen(false) }}
                className="lt-giftcard flex flex-col items-center gap-0.5 rounded-xl border border-line bg-ink-900 py-2 disabled:opacity-40"
              >
                <GiftArt id={g.id} size={38} />
                <span className="text-[11px] font-medium">{g.name}</span>
                <span className="text-[11px] text-fg-muted tabular-nums">{g.cost}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 min-h-[18px] text-xs text-fg-muted">{note ?? 'Demo coins only. Payments are not part of this prototype.'}</p>
        </div>
      )}

      {locked > 0 && <p className="fade-in border-t border-line bg-ink-900 px-4 py-2 text-center text-xs font-semibold text-sun-soft">{off ? 'Chat is off' : `Chat paused by the host · ${locked}s`}</p>}
      <form
        className="flex flex-wrap items-center gap-2 border-t border-line p-3"
        onSubmit={(e) => { e.preventDefault(); if (locked > 0) return; onSend(text); setText('') }}
      >
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={locked > 0 ? 'Chat is paused' : placeholder}
          disabled={locked > 0}
          maxLength={160}
          className="min-w-0 basis-full rounded-md border border-line bg-ink-900 px-3.5 py-2.5 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none"
        />
        {onGift && <button type="button" aria-pressed={giftOpen} onClick={() => { setTab('gift'); setGiftOpen((v) => !v) }} className={`lt-btn shrink-0 ${giftOpen ? 'is-hot' : ''}`} data-testid="gift-btn"><Gesture name="gift" size={17} />Gift</button>}
        {onGift && <button type="button" onClick={() => { setTab('poll'); setGiftOpen(true) }} className="lt-btn shrink-0" data-testid="poll-btn">Poll</button>}
        <button type="submit" className="ml-auto rounded-md bg-sky px-5 py-2 text-sm font-bold text-ink-950 transition hover:bg-sky-soft active:scale-95">Chat</button>
      </form>
    </section>
  )
}

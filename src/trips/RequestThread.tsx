import { useEffect, useRef, useState } from 'react'
import { useDemo, type TripRequest } from '../store'
import { clockTime, isUnread } from './requestHelpers'
import { $day, $usd } from './format'

const field = 'w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none'
const ghost = 'inline-flex items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-sky'

/** Private chat between the viewer who asked and the host (target or chosen one). */
export const RequestThread = ({ r }: { r: TripRequest }) => {
  const user = useDemo((s) => s.user)
  const send = useDemo((s) => s.sendRequestMessage)
  const markRead = useDemo((s) => s.markRequestRead)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const mine = !!user && r.byId === user.id
  const other = mine ? r.acceptedBy || ((r.targets && r.targets.length > 1) || r.anyone ? '' : r.hostName || r.targets?.[0] || '') : r.byName
  const unread = isUnread(user, r)
  const count = (r.msgs ?? []).length

  useEffect(() => { if (open && unread) markRead(r.id) }, [open, unread, count, markRead, r.id])
  useEffect(() => { if (open && ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [open, count])

  if (!user || !other || (!mine && !(r.hostName === user.name || r.acceptedBy === user.name)) || (r.status === 'cancelled' && !count)) return null

  const go = (e: React.FormEvent) => { e.preventDefault(); if (text.trim()) { send(r.id, text); setText('') } }
  return (
    <div className="flex flex-col gap-2" data-testid="req-thread">
      <button type="button" onClick={() => setOpen((v) => !v)} data-testid="thread-toggle" aria-expanded={open} className="inline-flex w-fit items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold hover:border-sky">
        Private chat with {other}
        {unread && <span className="rounded-full bg-sun px-2 text-xs font-bold text-ink-950" data-testid="thread-unread">New</span>}
      </button>
      {open && (
        <div className="flex flex-col gap-2 rounded-xl border border-line p-3">
          <p className="text-xs text-fg-muted">Only you and {other} can see this conversation.</p>
          <div ref={ref} className="flex max-h-56 flex-col gap-1.5 overflow-y-auto" data-testid="thread-msgs">
            {(r.msgs ?? []).map((m) => m.sys
              ? <p key={m.id} className="text-center text-xs text-fg-muted">{m.text} · {clockTime(m.at)}</p>
              : <div key={m.id} className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${m.by === user.id ? 'self-end bg-sky/20' : 'self-start bg-ink-700'}`}><span>{m.text}</span><span className="ml-2 text-[10px] text-fg-muted">{clockTime(m.at)}</span></div>)}
          </div>
          {r.status !== 'done' && (
            <form onSubmit={go} className="flex gap-2">
              <input aria-label="Message" data-testid="thread-input" className={`${field} !py-1.5`} value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder={`Write to ${other}`} />
              <button type="submit" className={ghost} data-testid="thread-send">Send</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

/** What the viewer sees on an open request once hosts answered: pick one. */
export const RequestResponses = ({ r }: { r: TripRequest }) => {
  const user = useDemo((s) => s.user)
  const choose = useDemo((s) => s.chooseResponse)
  const markRead = useDemo((s) => s.markRequestRead)
  const unread = isUnread(user, r)
  const list = r.responses ?? []
  useEffect(() => { if (unread) markRead(r.id) }, [unread, list.length, markRead, r.id])
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sun p-3" data-testid="responses">
      <p className="text-sm font-semibold">Responses ({list.length}). Choose one host.</p>
      {list.map((x) => (
        <div key={x.host} className="flex flex-wrap items-center justify-between gap-2 text-sm" data-testid="response-row">
          <span><b>{x.host}</b> · {$usd(x.usd)} · {$day(x.date)}</span>
          <button type="button" onClick={() => choose(r.id, x.host)} className="rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink-950" data-testid="choose-response">Choose {x.host}</button>
        </div>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_STREAMS, CATEGORIES, CITIES, cityOf, formatCount, HOSTS, type Category } from '../data/mock'
import { useDemo } from '../store'

import { VideoSlot } from '../components/VideoSlot'
import { CatIcon } from '../components/icons2'
import { ago, isOpen, left, order, useReplays, REPLAY_HOURS, type Replay } from '../replays'
import { card, ghost, primary, field } from './kit'

export const streamOf = (r: Replay) => ALL_STREAMS.find((s) => s.id === r.streamId) ?? ALL_STREAMS[0]
export const hostName = (r: Replay, me?: string) => (r.hostId === 'me' ? me ?? 'You' : HOSTS.find((h) => h.id === r.hostId)?.name ?? 'Host')

/** Replays a viewer can open: still inside the 48 hours, and the signed-in host's own only if they host. */
export function useOpenReplays(hostId?: string) {
  const list = useReplays((s) => s.list)
  const isHost = useDemo((s) => !!s.user?.isHost)
  return list.filter((r) => isOpen(r) && (r.hostId !== 'me' || isHost) && (!hostId || r.hostId === hostId)).sort(order)
}

export function ReplayThumb({ r, className = '' }: { r: Replay; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <VideoSlot stream={streamOf(r)} showLabel={false} className="!rounded-none" />
      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-ink-950/75 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">{r.minutes} min</span>
      {r.pinned && <span className="absolute left-1.5 top-1.5 rounded-full bg-sun px-2 py-0.5 text-[11px] font-bold text-ink-950">Pinned</span>}
    </div>
  )
}

export function ReplayCard({ r, to, me, onOpen }: { r: Replay; to: string; me?: string; onOpen?: () => void }) {
  const c = cityOf(r.cityId)
  const cls = 'lift group flex min-w-0 flex-col gap-2.5 text-left'
  const body = (
    <>
      <ReplayThumb r={r} />
      <div className="min-w-0">
        <h3 className="line-clamp-2 font-semibold leading-snug">{r.title}</h3>
        <p className="truncate text-sm text-fg-muted">{hostName(r, me)} · {c.name} · {ago(r)}</p>
        <p className="text-xs font-medium text-sky-deep">{left(r)} · {formatCount(r.views)} views</p>
      </div>
    </>
  )
  return onOpen ? <button type="button" onClick={onOpen} data-testid="replay-card" className={cls}>{body}</button> : <Link to={to} data-tilt data-testid="replay-card" className={cls}>{body}</Link>
}

/* ---------- player (web and phone) ---------- */
const SPEEDS = [1, 1.5, 2] as const
export function ReplayPlayer({ r, me }: { r: Replay; me?: string }) {
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [sp, setSp] = useState<(typeof SPEEDS)[number]>(1)
  const total = r.minutes * 60
  useEffect(() => {
    if (!playing) return
    const i = window.setInterval(() => setT((x) => (x + 15 * sp >= total ? (setPlaying(false), total) : x + 15 * sp)), 1000)
    return () => window.clearInterval(i)
  }, [playing, sp, total])
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  return (
    <div className="flex flex-col gap-3" data-testid="replay-player">
      <div className="relative overflow-hidden rounded-card">
        <VideoSlot stream={streamOf(r)} player showLabel={false} />
        <span className="absolute left-3 top-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">Replay · {left(r)}</span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => { if (t >= total) setT(0); setPlaying((v) => !v) }} aria-label={playing ? 'Pause' : 'Play'} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky text-ink-950" data-testid="replay-play">{playing ? '❚❚' : '▶'}</button>
        <input type="range" min={0} max={total} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Position" className="h-1.5 min-w-0 flex-1 accent-[rgb(var(--sky-rgb))]" />
        <span className="w-[88px] shrink-0 text-right text-xs tabular-nums text-fg-muted">{mm(t)} / {mm(total)}</span>
        <button type="button" onClick={() => setSp(SPEEDS[(SPEEDS.indexOf(sp) + 1) % SPEEDS.length])} className="w-10 shrink-0 rounded-md border border-line py-1 text-xs font-bold tabular-nums">{sp}x</button>
      </div>
      <div>
        <h1 className="text-xl font-semibold leading-snug sm:text-2xl">{r.title}</h1>
        <p className="text-fg-muted">{hostName(r, me)}, {r.place}, {cityOf(r.cityId).name} · {ago(r)} · {formatCount(r.views)} views</p>
        {r.note && <p className="mt-2 rounded-xl bg-ink-800 px-4 py-2.5 text-sm">{r.note}</p>}
      </div>
      <ReplayComments r={r} me={me} />
      <p className="text-sm text-fg-muted">Chat, votes and gifts are closed on replays. This replay stays for {REPLAY_HOURS} hours after the live.</p>
    </div>
  )
}

/* ---------- comments ---------- */
const since = (t: number) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : 'Yesterday' }
export function ReplayComments({ r, me }: { r: Replay; me?: string }) {
  const list = useReplays((s) => s.comments[r.id]) ?? []
  const add = useReplays((s) => s.addComment)
  const rm = useReplays((s) => s.removeComment)
  const [text, setText] = useState('')
  const isHost = r.hostId === 'me'
  if (!r.commentsOn) return <section className="rounded-card border border-dashed border-line px-4 py-3 text-sm text-fg-muted" data-testid="comments-off">The host turned comments off for this replay.</section>
  return (
    <section className="flex flex-col gap-3" aria-label="Comments" data-testid="comments">
      <h2 className="text-lg font-bold">Comments <span className="text-fg-muted">({list.length})</span></h2>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (t) { add(r.id, me ?? 'You', t); setText('') } }}>
        <input className={field} value={text} maxLength={200} onChange={(e) => setText(e.target.value)} placeholder="Add a comment" aria-label="Add a comment" data-testid="comment-input" />
        <button type="submit" className={primary} disabled={!text.trim()} data-testid="comment-send">Post</button>
      </form>
      {list.length === 0 && <p className="text-sm text-fg-muted">No comments yet. Be the first.</p>}
      <ul className="flex flex-col divide-y divide-line">
        {[...list].reverse().map((c) => (
          <li key={c.id} className="flex items-start gap-3 py-3" data-testid="comment">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-700 text-xs font-bold">{c.who.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1"><p className="text-sm"><b>{c.who}</b> <span className="text-fg-muted">· {since(c.at)}</span></p><p className="break-words">{c.text}</p></div>
            {(c.mine || isHost) && <button type="button" onClick={() => rm(r.id, c.id)} aria-label="Delete comment" className="shrink-0 text-sm text-fg-muted hover:text-red-600">Delete</button>}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- host manager (web Studio and phone Studio) ---------- */
export function ReplayManager({ onView }: { onView?: (id: string) => void }) {
  const user = useDemo((s) => s.user)
  const { list, add, update, remove, togglePin, renew } = useReplays()
  const sessions = useDemo((s) => s.sessions)
  const mine = list.filter((r) => r.hostId === 'me').sort(order)
  const [edit, setEdit] = useState<string | null>(null)
  const [draft, setDraft] = useState({ title: '', note: '', category: 'Discovery' as Category })
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', note: '', cityId: user?.hostCity ?? 'paris', category: 'Discovery' as Category })
  const [del, setDel] = useState<string | null>(null)
  const open = mine.filter(isOpen).length
  const startEdit = (r: Replay) => { setEdit(r.id); setDraft({ title: r.title, note: r.note, category: r.category }) }
  const base = ALL_STREAMS.find((s) => s.cityId === form.cityId) ?? ALL_STREAMS[0]
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    add({ hostId: 'me', streamId: base.id, title: form.title.trim(), note: form.note.trim(), place: base.place, cityId: form.cityId, category: form.category, minutes: 30 })
    setForm({ ...form, title: '', note: '' }); setAdding(false)
  }
  return (
    <div className="flex flex-col gap-5" data-testid="replay-manager">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">{open} of {mine.length} replays are open to viewers. Each one stays {REPLAY_HOURS} hours after the live.</p>
        <button type="button" onClick={() => setAdding((v) => !v)} className={primary} data-testid="replay-add">{adding ? 'Close' : 'Add a replay'}</button>
      </div>

      {adding && (
        <form onSubmit={submit} className={`${card} fade-in flex flex-col gap-3`}>
          {sessions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-fg-muted">From a session:</span>
              {sessions.slice(0, 3).map((s) => <button key={s.id} type="button" onClick={() => setForm({ ...form, title: s.title, cityId: s.cityId })} className={ghost}>{s.title.slice(0, 26)}</button>)}
            </div>
          )}
          <label className="flex flex-col gap-1 text-sm font-medium">Title<input className={field} value={form.title} maxLength={80} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="replay-title" /></label>
          <label className="flex flex-col gap-1 text-sm font-medium">Note for viewers (optional)<input className={field} value={form.note} maxLength={120} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">City<select className={field} value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="flex flex-col gap-1 text-sm font-medium">Category<select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          </div>
          <div><button type="submit" className={primary} data-testid="replay-save-new">Publish for 48 hours</button></div>
        </form>
      )}

      {mine.length === 0 && <p className="rounded-card border border-dashed border-line p-8 text-center text-fg-muted">No replays yet. After a live, it appears here.</p>}
      <ul className="flex flex-col gap-3">
        {mine.map((r) => {
          const on = isOpen(r)
          return (
            <li key={r.id} data-testid="replay-row" className={`${card} flex flex-col gap-3 !p-3 sm:!p-4 ${on ? '' : 'opacity-75'}`}>
              <div className="flex gap-3">
                <ReplayThumb r={r} className="w-[116px] shrink-0 sm:w-[160px]" />
                <div className="min-w-0 flex-1">
                  {edit === r.id ? (
                    <div className="flex flex-col gap-2">
                      <input className={field} value={draft.title} maxLength={80} onChange={(e) => setDraft({ ...draft, title: e.target.value })} aria-label="Title" data-testid="replay-edit-title" />
                      <input className={field} value={draft.note} maxLength={120} placeholder="Note for viewers" onChange={(e) => setDraft({ ...draft, note: e.target.value })} aria-label="Note" />
                      <select className={field} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })} aria-label="Category">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                    </div>
                  ) : (
                    <>
                      <p className="line-clamp-2 font-semibold leading-snug">{r.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-fg-muted"><CatIcon c={r.category} size={16} /><span className="truncate">{r.category} · {cityOf(r.cityId).name}</span></p>
                      <p className={`mt-1 text-xs font-semibold ${on ? 'text-sky-deep' : 'text-[color:var(--warn,#b45309)]'}`}>{on ? left(r) : 'Expired, hidden from viewers'} · {formatCount(r.views)} views</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {edit === r.id ? (
                  <>
                    <button type="button" className={primary} onClick={() => { update(r.id, { title: draft.title.trim() || r.title, note: draft.note.trim(), category: draft.category }); setEdit(null) }} data-testid="replay-edit-save">Save</button>
                    <button type="button" className={ghost} onClick={() => setEdit(null)}>Cancel</button>
                  </>
                ) : del === r.id ? (
                  <>
                    <span className="text-sm">Delete this replay?</span>
                    <button type="button" className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white" onClick={() => { remove(r.id); setDel(null) }} data-testid="replay-confirm-delete">Delete</button>
                    <button type="button" className={ghost} onClick={() => setDel(null)}>Keep</button>
                  </>
                ) : (
                  <>
                    {on && <button type="button" className={ghost} aria-pressed={r.pinned} onClick={() => togglePin(r.id)} data-testid="replay-pin">{r.pinned ? 'Unpin' : 'Pin to top'}</button>}
                    <button type="button" className={ghost} onClick={() => startEdit(r)} data-testid="replay-edit">Edit</button>
                    <button type="button" className={ghost} aria-pressed={r.commentsOn} onClick={() => update(r.id, { commentsOn: !r.commentsOn })} data-testid="replay-comments">Comments {r.commentsOn ? 'on' : 'off'}</button>
                    {!on && <button type="button" className={ghost} onClick={() => renew(r.id)} data-testid="replay-renew">Publish again for 48 h</button>}
                    {on && (onView ? <button type="button" className={ghost} onClick={() => onView(r.id)}>View</button> : <Link to={`/app/replay/${r.id}`} className={ghost}>View</Link>)}
                    <button type="button" className={`${ghost} ml-auto !text-red-600`} onClick={() => setDel(r.id)} data-testid="replay-delete">Delete</button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-fg-muted">Pinned replay: shown first on your public profile and in Replays. One at a time.</p>
    </div>
  )
}

// Group: one block for friends, family or a class. One "room chief" votes for everyone.
import { useState } from 'react'
import { STREAMS } from '../data/mock'
import { useDemo } from '../store'
import { planOf } from '../data/plans'
import { useExtra } from '../extra'
import { Block, card, field, ghost, primary, Pill } from './kit'

/** One block for everything done together: friends, family or a class. */
export function GroupView({ onWatch }: { onWatch?: (id: string) => void }) {
  const user = useDemo((s) => s.user)
  const { group, createGroup, joinGroup, leaveGroup, addToGroup } = useExtra()
  const [code, setCode] = useState('')
  const [who, setWho] = useState('')
  const [err, setErr] = useState('')
  const name = user?.name ?? 'You'
  const plan = useDemo((s) => s.plan)
  const cap = planOf(plan).group
  return (
    <section className={`${card} flex flex-col gap-5`} data-testid="group-block" aria-label="Group">
      {!group ? (
        <>
          <p className="text-fg-muted">Watch together. One person votes for everyone, the others chat.</p>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <button type="button" className={primary} onClick={() => createGroup('friends', name)} data-testid="group-create">Create the group</button>
            <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (!joinGroup(code, name)) setErr('Enter the 4-letter code.'); else setErr('') }}>
              <input aria-label="Group code" className={`${field} !w-32`} value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code" />
              <button className={ghost} type="submit">Join with a code</button>
            </form>
          </div>
          {err && <p role="alert" className="text-sm text-fg-muted">{err}</p>}
        </>
      ) : (
        <div className="flex flex-col gap-5" data-testid="group-room">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm text-fg-muted">Share this code to invite people.</p><p className="text-3xl font-semibold tracking-widest" data-testid="group-code">{group.code}</p></div>
            <Pill tone="sun">{group.members.length} people</Pill>
          </div>
          <ul className="flex flex-wrap gap-2">{group.members.map((m) => <li key={m} className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1 text-sm">{m}{m === group.chief && <Pill tone="sun">votes</Pill>}</li>)}</ul>
          <form className="flex max-w-[420px] gap-2" onSubmit={(e) => { e.preventDefault(); if (group && group.members.length >= cap) { setErr(`${planOf(plan).name} plan: groups up to ${cap} people. Upgrade to add more.`); return } addToGroup(who); setWho(''); setErr('') }}>
            <input aria-label="Add a person" className={field} value={who} maxLength={24} onChange={(e) => setWho(e.target.value)} placeholder="Add a person by name" />
            <button className={ghost} type="submit">Add</button>
          </form>
          {err && <p role="alert" className="text-sm text-fg-muted" data-testid="group-cap">{err} <a href="#/app/plan" className="font-semibold text-sky-deep underline">See plans</a></p>}
          <p className="text-sm text-fg-muted">{group.chief === name ? `When you vote in a live, it counts for all ${group.members.length} people.` : `${group.chief} votes for the whole group. You keep chat and questions.`}</p>
          <div className="flex flex-wrap gap-3">
            {onWatch && <button type="button" className={primary} onClick={() => onWatch(STREAMS[0].id)}>Pick a live</button>}
            <button type="button" className={ghost} onClick={leaveGroup}>Leave the group</button>
          </div>
        </div>
      )}
    </section>
  )
}

/** Shown on a live page while a group is active. */
export function GroupBar() {
  const user = useDemo((s) => s.user)
  const group = useExtra((s) => s.group)
  if (!group) return null
  const chief = group.chief === (user?.name ?? 'You')
  return <p className="rounded-xl border border-sun px-4 py-2 text-sm" data-testid="group-bar">Group {group.code} · {group.members.length} people. {chief ? 'Your vote counts for everyone.' : `${group.chief} votes for the group.`}</p>
}

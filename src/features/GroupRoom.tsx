// The room of one group: code and link, people, live of the group, private chat, leave.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../store'
import { planOf } from '../data/plans'
import { groupLink, useGroup, type Group } from '../groupStore'
import GroupChat from './GroupChat'
import { field, ghost, primary, Pill } from './kit'

const chip = 'rounded-pill border border-line px-2.5 py-1 text-xs font-semibold hover:border-sky'

export default function GroupRoom({ group, me, onWatch }: { group: Group; me: string; onWatch?: (id: string) => void }) {
  const { leaveGroup, addToGroup, transferChief, removeFromGroup, regenCode } = useGroup()
  const plan = useDemo((s) => s.plan)
  const cap = planOf(plan).group
  const [who, setWho] = useState('')
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState('')
  const [confirm, setConfirm] = useState(false)
  const nav = useNavigate()
  const chief = group.chief === me
  const copy = (text: string, key: string) => {
    try { navigator.clipboard.writeText(text).catch(() => {}) } catch { /* clipboard unavailable */ }
    setCopied(key)
    setTimeout(() => setCopied(''), 1600)
  }
  return (
    <div className="flex flex-col gap-5" data-testid="group-room">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-fg-muted">Share this code or the link to invite people.</p>
          <p className="text-3xl font-semibold tracking-widest" data-testid="group-code">{group.code}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={chip} title="Copy the code" data-testid="copy-code" onClick={() => copy(group.code, 'c')}>{copied === 'c' ? 'Copied' : 'Copy code'}</button>
            <button type="button" className={chip} title="Copy the invite link" data-testid="copy-link" onClick={() => copy(groupLink(group.code), 'l')}>{copied === 'l' ? 'Copied' : 'Copy link'}</button>
            {chief && <button type="button" className={chip} title="Make a new code. The old one stops working." data-testid="new-code" onClick={regenCode}>New code</button>}
          </div>
        </div>
        <Pill tone="sun">{group.members.length} / {cap} people</Pill>
      </div>
      <ul className="flex flex-wrap gap-2">
        {group.members.map((m) => (
          <li key={m} className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1 text-sm">
            {m}
            {m === group.chief && <Pill tone="sun">leader</Pill>}
            {chief && m !== group.chief && (
              <>
                <button type="button" className="text-xs text-sky underline" title={`Make ${m} the leader`} onClick={() => transferChief(m)}>Make leader</button>
                <button type="button" className="text-xs text-fg-muted" title={`Remove ${m}`} aria-label={`Remove ${m}`} onClick={() => removeFromGroup(m)}>×</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {chief && (
        <form className="flex max-w-[420px] gap-2" onSubmit={(e) => { e.preventDefault(); if (group.members.length >= cap) { setErr(`${planOf(plan).name} plan: groups up to ${cap} people. Upgrade to add more.`); return } addToGroup(who); setWho(''); setErr('') }}>
          <input aria-label="Add a person" className={field} value={who} maxLength={24} onChange={(e) => setWho(e.target.value)} placeholder="Add a person by name" />
          <button className={ghost} type="submit">Add</button>
        </form>
      )}
      {err && <p role="alert" className="text-sm text-fg-muted" data-testid="group-cap">{err} <a href="#/app/plan" className="font-semibold text-sky-deep underline">See plans</a></p>}
      <div className="flex flex-col gap-2 rounded-xl border border-line p-3" data-testid="group-live">
        <p className="text-sm font-semibold">Live of the group</p>
        {group.liveId ? (
          <p className="text-sm">{group.liveTitle}{onWatch && <button type="button" className={`ml-3 ${chip}`} data-testid="group-watch" onClick={() => onWatch(group.liveId as string)}>Watch with the group</button>}</p>
        ) : (
          <p className="text-sm text-fg-muted">{chief ? 'Open any live, watch it, then choose it for the group from the live page.' : `${group.chief} has not picked a live yet.`}</p>
        )}
        {chief && <button type="button" className={primary} data-testid="group-pick" onClick={() => nav('/app/live')}>{group.liveId ? 'Change the live' : 'Pick a live to watch'}</button>}
      </div>
      <GroupChat group={group} me={me} />
      <p className="text-sm text-fg-muted">{chief ? `You are the leader. When you vote in a live, it counts for all ${group.members.length} people.` : `${group.chief} votes for the whole group. You keep the group chat and your questions.`}</p>
      <div className="flex flex-wrap gap-3">
        {confirm ? (
          <>
            <span className="text-sm">{chief ? 'Close the group for everyone?' : 'Leave this group?'}</span>
            <button type="button" className={primary} data-testid="group-leave-yes" onClick={leaveGroup}>{chief ? 'Close the group' : 'Leave'}</button>
            <button type="button" className={ghost} onClick={() => setConfirm(false)}>Stay</button>
          </>
        ) : (
          <button type="button" className={ghost} data-testid="group-leave" onClick={() => setConfirm(true)}>{chief ? 'Close the group' : 'Leave the group'}</button>
        )}
      </div>
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { planOf } from '../../data/plans'
import { useState } from 'react'
import { CATEGORIES, cityOf, type Category } from '../../data/mock'
import { useDemo } from '../../store'
import { Avatar, Chip } from '../../components/ui'
import { CatE3 } from '../../live/e3d'
import { BadgeRow, PlanBadge, useStats } from '../../features/ProfileBits'
import { useReplays, isOpen } from '../../replays'

const field = 'w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-[15px] focus:border-sky focus:outline-none'
const LANGS = ['English', 'French', 'Arabic', 'Spanish', 'Japanese', 'Italian', 'Turkish', 'Portuguese']
const PLAN_BG: Record<string, string> = {
  free: 'linear-gradient(120deg,#24B1F4,#7cc9f0)',
  plus: 'linear-gradient(120deg,#1d8fc9,#24B1F4 45%,#FA8F1C)',
  premium: 'linear-gradient(120deg,#1a2f6b,#6a3fd1 40%,#FA8F1C 85%,#ffd36a)',
}

export default function Settings() {
  const { user, patchUser, signOut, plan, reset, coins } = useDemo()
  const st = useStats()
  const open = useReplays((s) => s.list.filter((r) => r.hostId === 'me' && isOpen(r)).length)
  const nav = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [saved, setSaved] = useState(false)
  if (!user) return null
  const toggle = (c: Category) => patchUser({ interests: user.interests.includes(c) ? user.interests.filter((x) => x !== c) : [...user.interests, c] })
  const toggleLang = (l: string) => patchUser({ languages: user.languages.includes(l) ? user.languages.filter((x) => x !== l) : [...user.languages, l] })
  const stats: [string, string][] = [['Lives visited', String(st.visited)], ['Countries', String(st.countries)], ['Gifts sent', String(st.gifts)]]
  const complete = Math.round(([name.trim(), bio.trim(), user.languages.length, user.interests.length].filter(Boolean).length / 4) * 100)

  return (
    <div className="flex max-w-[860px] flex-col gap-8">
      <section className="overflow-hidden rounded-card border border-line bg-ink-800" data-testid="profile-hero">
        <div className="relative h-28 sm:h-32" style={{ background: PLAN_BG[plan] }}>
          <div className="absolute right-4 top-4 text-white"><PlanBadge plan={plan} /></div>
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <span className="relative z-10 rounded-full bg-ink-800 p-1.5 shadow-lg"><Avatar name={user.name} size={80} /></span>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-2xl font-extrabold sm:text-3xl">{user.name}</h1>
              <p className="truncate text-sm text-fg-muted">{user.email} · {user.isHost ? `Host in ${cityOf(user.hostCity ?? 'paris').name}` : 'Viewer'} · Level {st.level}</p>
            </div>
          </div>
          {user.bio ? <p className="mt-4 max-w-[60ch]">{user.bio}</p> : <p className="mt-4 text-sm text-fg-muted">Add a short bio below so hosts know who you are.</p>}
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map(([k, v]) => <div key={k} className="rounded-2xl bg-ink-900 p-3"><dt className="text-xs text-fg-muted">{k}</dt><dd className="font-display text-2xl font-extrabold tabular-nums">{v}</dd></div>)}
          </dl>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between"><h2 className="text-lg font-bold">Badges</h2><span className="text-sm text-fg-muted">{st.earned} of {st.badges.length} earned</span></div>
        <BadgeRow />
      </section>

      <section className="flex flex-col gap-4 rounded-card border border-line bg-ink-800 p-5 sm:p-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Edit profile</h2>
          <span className="text-sm text-fg-muted">{complete}% complete</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-sky transition-[width] duration-500" style={{ width: `${complete}%` }} /></div>
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { patchUser({ name: name.trim(), bio: bio.trim().slice(0, 140) }); setSaved(true); window.setTimeout(() => setSaved(false), 1600) } }}>
          <label htmlFor="s-name" className="text-sm font-medium">Display name</label>
          <input id="s-name" className={field} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="s-bio" className="text-sm font-medium">Bio <span className="font-normal text-fg-muted">({bio.length}/140)</span></label>
          <textarea id="s-bio" rows={2} className={field} value={bio} maxLength={140} placeholder="What do you like to discover?" onChange={(e) => setBio(e.target.value)} />
          <div><button type="submit" className="rounded-pill bg-sky px-5 py-2.5 font-display text-sm font-bold text-ink-950 hover:bg-sky-soft">{saved ? 'Saved' : 'Save profile'}</button></div>
        </form>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Languages you speak</legend>
          <div className="flex flex-wrap gap-2">{LANGS.map((l) => <Chip key={l} active={user.languages.includes(l)} onClick={() => toggleLang(l)}>{l}</Chip>)}</div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Interests, used for your Discover picks</legend>
          <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c} active={user.interests.includes(c)} onClick={() => toggle(c)}><span className="inline-flex items-center gap-1.5"><CatE3 c={c} size={16} />{c}</span></Chip>)}</div>
        </fieldset>
      </section>

      {user.isHost && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-ink-800 p-5">
          <div><h2 className="text-lg font-bold">Your host profile</h2><p className="text-sm text-fg-muted">{open} replays open for 48 hours · {st.sessions} sessions</p></div>
          <div className="flex flex-wrap gap-2"><Link to="/app/host/me" className="rounded-pill border border-line px-4 py-2 text-sm font-semibold hover:border-sky">Public page</Link><Link to="/studio/replays" className="rounded-pill border border-line px-4 py-2 text-sm font-semibold hover:border-sky">Replays</Link><Link to="/studio" className="rounded-pill bg-sun px-4 py-2 text-sm font-bold text-ink-950">Studio</Link></div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">More</h2>
        <ul className="flex flex-col overflow-hidden rounded-card border border-line bg-ink-800">
          {[
            ['/app/plan', 'Plan', planOf(plan).name],
            ['/app/wallet', 'Wallet', `${coins.toLocaleString()} coins`],
            ['/app/trips', 'My trips', 'Tickets and moments'],
            ['/app/replays', 'Replays', 'Last 48 hours'],
            ['/app/following', 'Following', 'Hosts, cities and alerts'],
          ].map(([to, label, hint]) => (
            <li key={to} className="border-t border-line first:border-t-0">
              <Link to={to} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-ink-700"><span className="font-medium">{label}</span><span className="text-sm text-fg-muted">{hint}</span></Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => { signOut(); nav('/') }} className="rounded-pill border border-line px-5 py-2.5 font-display text-sm font-semibold hover:bg-ink-800">Sign out</button>
        <button type="button" onClick={() => { reset(); nav('/') }} className="rounded-pill px-5 py-2.5 text-sm text-fg-muted hover:text-fg">Reset demo</button>
      </div>
    </div>
  )
}
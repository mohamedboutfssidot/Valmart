// "Join with a code" and "Create a room". No router: the page decides what happens next.
import { useState } from 'react'
import { CATEGORIES, CITIES, type Category } from '../data/mock'
import { Chip } from '../components/ui'
import { HostModePicker, type HostMode } from '../live/director'
import { createRoom, getName, normalizeCode, saveName, validCode, type Created } from './api'
import { ErrorLine, field, primary } from './parts'
import { LiveNowList } from './LiveNow'

const CATS: Category[] = ['Discovery', 'Cultural Tour', 'Food Journey', 'Night Exploration', 'Hidden Places', 'Travel Guide', 'Horror'].filter((c): c is Category => (CATEGORIES as readonly string[]).includes(c))

export function RoomEntry({ onJoin, onWatch, onCreated, allowTeam = true, mobile = false }: {
  onJoin: (code: string, name: string) => void
  onWatch: (room: string) => void
  onCreated: (c: Created, o: { hostMode: HostMode; category: Category }) => void
  allowTeam?: boolean; mobile?: boolean
}) {
  const [code, setCode] = useState('')
  const [name, setName] = useState(getName)
  const [hostMode, setHostMode] = useState<HostMode>(() => (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 'auto' : 'manual'))
  const [category, setCategory] = useState<Category>('Discovery')
  const [cityId, setCityId] = useState(CITIES[0].id)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const norm = normalizeCode(code)

  const create = async () => {
    setBusy(true); setErr('')
    const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0]
    saveName(name)
    try { onCreated(await createRoom({ title: title.trim() || `${category} in ${city.name}`, city: city.name, country: city.country, category, host: name.trim() || 'Host' }), { hostMode, category }) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Could not create the room') }
    finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-5">
      <LiveNowList mobile={mobile} onOpen={(l) => onWatch(l.room)} />

      <section className="flex flex-col gap-3 rounded-card border border-line bg-ink-800 p-4 sm:p-5" aria-label="Go live">
        <h2 className="font-display text-lg font-bold">Go live yourself</h2>
        <p className="text-sm text-fg-muted">Your live appears in “Live now” for everyone. No account needed for this test.</p>
        <label className="flex flex-col gap-1 text-sm font-medium">Title
          <input aria-label="Live title" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Sunset walk in the old town" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">City
          <select aria-label="City" value={cityId} onChange={(e) => setCityId(e.target.value)} className={field}>{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">Your name
          <input aria-label="Your host name" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Type of experience</legend>
          <div className="flex flex-wrap gap-2">{CATS.map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}</div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">How do you run it?</legend>
          <HostModePicker value={hostMode} onChange={setHostMode} compact={mobile} mobile={mobile} />
          {!allowTeam && hostMode === 'team' && <p className="text-xs text-fg-muted">Team mode starts from a computer. Choose a solo mode on the phone.</p>}
        </fieldset>
        <button type="button" disabled={busy || (!allowTeam && hostMode === 'team')} onClick={create} className={primary}>{busy ? 'Creating…' : hostMode === 'team' ? 'Create the room and open the control room' : 'Create the room'}</button>
      </section>
      <ErrorLine text={err} />
      <details className="rounded-card border border-line bg-ink-800 p-4 text-sm" aria-label="Join with a code">
        <summary className="cursor-pointer font-medium text-fg-muted">Have a code or a private link?</summary>
        <form className="mt-3 flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (validCode(norm)) { saveName(name); onJoin(norm, name) } else setErr('The code looks like ABC-123.') }}>
          <input aria-label="Room code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr('') }} placeholder="Room code" maxLength={8} autoCapitalize="characters" autoComplete="off" className={`${field} text-center font-mono text-xl tracking-widest`} />
          <button type="submit" className={primary}>Join</button>
        </form>
      </details>
      {mobile ? null : <p className="text-xs text-fg-muted">Free test limits: 100 people at once and 5,000 participant-minutes a month for the whole project.</p>}
    </div>
  )
}

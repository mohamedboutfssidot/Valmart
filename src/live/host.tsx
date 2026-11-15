import { useState } from 'react'
import { useLiveTools, withSecs } from './store'
import { StarButton, Switch } from './manage'
import { BRICKS, KITS, kitFor, kitLabel, TOOLS, type BrickId, type Kind, type Kit, type ToolDef } from './tools'
import type { ToolEngine } from './useToolEngine'

/* ---------- launcher: the host picks a tool, the room answers ---------- */
export function ToolLauncher({ e, category, onBuild, compact = false, manageHref, onManage }: { e: ToolEngine; category: string; onBuild: () => void; compact?: boolean; manageHref?: string; onManage?: () => void }) {
  const { custom, off, fav, secs, toggleTool, toggleFav } = useLiveTools()
  const hasFav = [...TOOLS, ...custom].some((t) => fav.includes(t.id))
  const [kit, setKit] = useState<Kit | 'fav'>(hasFav ? 'fav' : kitFor(category))
  const [edit, setEdit] = useState(false)
  const tabs: { id: Kit | 'fav'; label: string }[] = [...(hasFav ? [{ id: 'fav' as const, label: 'Favourites' }] : []), ...KITS.map((k) => ({ id: k.id, label: k.label })), ...(custom.length ? [{ id: 'custom' as Kit, label: 'Yours' }] : [])]
  const pool = [...TOOLS, ...custom]
  const base = kit === 'fav' ? pool.filter((t) => fav.includes(t.id)) : kit === 'custom' ? custom : TOOLS.filter((t) => t.kit === kit)
  const list = edit ? base : base.filter((t) => !off.includes(t.id))
  const hidden = base.length - base.filter((t) => !off.includes(t.id)).length
  const busy = (id: string) => e.active?.def.id === id || e.queue.some((q) => q.id === id)
  const recommended = kitFor(category)
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-ink-800 p-4" aria-label="Launch a tool" data-testid="launcher">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Launch a tool</h2>
        <button type="button" aria-pressed={edit} onClick={() => setEdit((v) => !v)} className="text-sm font-semibold text-sky-deep hover:underline" data-testid="launcher-edit">{edit ? 'Done' : 'Edit list'}</button>
      </div>
      <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={kit === t.id} onClick={() => setKit(t.id)} className={`-mb-px shrink-0 border-b-2 py-2 text-sm font-semibold ${kit === t.id ? 'border-sky-deep text-fg' : 'border-transparent text-fg-muted'}`}>{t.label}</button>
        ))}
      </div>
      {kit !== 'fav' && kit !== 'custom' && kit === recommended && <p className="text-xs text-fg-muted">This kit suits the {category} category.</p>}
      <ul className="flex flex-col">
        {list.map((t) => {
          const on = !off.includes(t.id)
          return (
            <li key={t.id} className={`flex items-center gap-3 border-t border-line py-2 ${on ? '' : 'opacity-60'}`}>
              {edit && <StarButton on={fav.includes(t.id)} onChange={() => toggleFav(t.id)} name={t.name} />}
              <button type="button" disabled={!on} onClick={() => e.launch(withSecs(t, secs))} className={`flex min-w-0 flex-1 flex-col items-start rounded-lg px-2 py-1.5 text-left transition-colors ${busy(t.id) ? 'bg-sun/10' : 'hover:bg-ink-700'} disabled:cursor-not-allowed`}>
                <span className="flex w-full items-center justify-between gap-2"><span className="font-semibold">{t.name}</span><span className="text-xs text-fg-muted">{busy(t.id) ? (e.active?.def.id === t.id ? 'On air' : 'Queued') : `${secs[t.id] ?? t.seconds}s`}</span></span>
                <span className="text-[13px] text-fg-muted">{t.summary}</span>
              </button>
              {edit && <Switch on={on} onChange={() => toggleTool(t.id)} label={`${t.name} ${on ? 'on' : 'off'}`} />}
            </li>
          )
        })}
        {list.length === 0 && <li className="border-t border-line py-3 text-sm text-fg-muted">{kit === 'fav' ? 'Star tools with Edit list to keep them here.' : 'All tools in this kit are off.'}</li>}
      </ul>
      {!edit && hidden > 0 && <p className="text-xs text-fg-muted">{hidden} turned off in this kit.</p>}
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-sky-deep">
        <button type="button" onClick={onBuild} className="hover:underline">Build or request a tool</button>
        {manageHref && <a href={manageHref} className="hover:underline">All tool settings</a>}
        {onManage && <button type="button" onClick={onManage} className="hover:underline">All tool settings</button>}
      </div>
    </section>
  )
}

/* ---------- builder: bricks in, tool out. No code. ---------- */
const MAIN: { id: Kind; label: string; brick: BrickId }[] = [
  { id: 'choice', label: 'Choice', brick: 'choice' },
  { id: 'slider', label: 'Slider', brick: 'slider' },
  { id: 'pin', label: 'Pin on the image', brick: 'pin' },
  { id: 'mission', label: 'Mission', brick: 'mission' },
  { id: 'lock', label: 'Chat lock', brick: 'lock' },
]
const field = 'w-full rounded-xl border border-line bg-ink-900 px-3.5 py-2.5 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none'

function Preview({ def }: { def: ToolDef }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-sun bg-ink-900 p-4" aria-label="Preview">
      <div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-sun-soft">Host tool · {def.name || 'Untitled'}</span><span className="rounded-pill border border-line px-2.5 py-0.5 text-xs font-semibold">{def.seconds}s</span></div>
      <p className="font-display text-base font-bold leading-snug">{def.prompt || 'Your question appears here'}</p>
      {def.kind === 'choice' && def.options!.map((o, i) => <span key={i} className="rounded-xl border border-line px-3 py-2 text-sm font-semibold">{o || `Option ${i + 1}`}</span>)}
      {def.kind === 'slider' && <div className="h-2 rounded-full bg-ink-700"><div className="h-full w-2/3 rounded-full bg-sun" /></div>}
      {def.kind === 'pin' && <span className="rounded-xl border border-dashed border-line px-3 py-2 text-sm text-fg-muted">Viewers tap the video</span>}
      {def.kind === 'mission' && <span className="rounded-pill bg-sun px-4 py-2 text-center text-sm font-bold text-ink-950">Done</span>}
      {def.kind === 'lock' && <span className="text-sm text-fg-muted">Chat paused for {def.seconds} s</span>}
      {def.reveal && <span className="rounded-xl bg-ink-800 px-3 py-2 text-sm text-sky-soft">Reveal: {def.reveal.text}</span>}
      {def.sound && <span className="text-xs text-fg-muted">Sound cue: {def.sound}</span>}
    </div>
  )
}

export function ToolBuilder({ category, onDone, onLaunch }: { category: string; onDone: () => void; onLaunch?: (t: ToolDef) => void }) {
  const { addTool, request, custom } = useLiveTools()
  const [tab, setTab] = useState<'build' | 'request'>('build')
  const [name, setName] = useState('Fear meter')
  const [kind, setKind] = useState<Kind>('slider')
  const [prompt, setPrompt] = useState('How scared are you?')
  const [options, setOptions] = useState(['Yes', 'No'])
  const [seconds, setSeconds] = useState(20)
  const [reveal, setReveal] = useState('Hidden room unlocked.')
  const [useReveal, setUseReveal] = useState(true)
  const [sound, setSound] = useState('')
  const [lock, setLock] = useState(false)
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const bricks: BrickId[] = [MAIN.find((m) => m.id === kind)!.brick, 'countdown', ...(useReveal && kind !== 'lock' ? (['reveal'] as BrickId[]) : []), ...(sound ? (['sound'] as BrickId[]) : []), ...(lock && kind !== 'lock' ? (['lock'] as BrickId[]) : [])]
  const def: ToolDef = {
    id: `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'tool'}`, name: name.trim(), kit: 'custom', kind, prompt: prompt.trim(), summary: 'Built by you', seconds,
    options: kind === 'choice' ? options.filter((o) => o.trim()).slice(0, 4) : undefined,
    min: 0, max: 10, lean: kind === 'slider' ? 6 : kind === 'choice' ? options.map((_, i) => (i === 0 ? 3 : 2)) : undefined,
    reveal: useReveal && kind !== 'lock' && reveal.trim() ? { text: reveal.trim() } : undefined,
    sound: sound.trim() || undefined,
    effect: kind === 'lock' || lock ? 'lockchat' : null,
    bricks,
  }
  const valid = def.name && def.prompt && (kind !== 'choice' || (def.options?.length ?? 0) >= 2)
  const save = (launch: boolean) => {
    if (!valid) return setMsg('Add a name, a question, and at least two options for a choice.')
    addTool(def)
    if (launch) onLaunch?.(def)
    setMsg(launch ? 'Saved and launched.' : 'Saved to Your tools.')
    window.setTimeout(onDone, 700)
  }
  const send = () => {
    if (!name.trim() || !note.trim()) return setMsg('Name the tool and say what it should do.')
    request({ name: name.trim(), note: note.trim(), category })
    setMsg('Request sent. Valmart will reply with a preview.')
    setNote('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 rounded-pill border border-line p-1" role="tablist">
        {([['build', 'Build it'], ['request', 'Ask Valmart']] as const).map(([id, l]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setMsg(null) }} className={`rounded-pill py-2 text-sm font-semibold ${tab === id ? 'bg-sky text-ink-950' : 'text-fg-muted'}`}>{l}</button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5"><label htmlFor="tb-name" className="text-sm font-medium">Tool name</label><input id="tb-name" className={field} value={name} maxLength={28} onChange={(ev) => setName(ev.target.value)} /></div>

      {tab === 'request' ? (
        <>
          <div className="flex flex-col gap-1.5"><label htmlFor="tb-note" className="text-sm font-medium">What should it do?</label><textarea id="tb-note" className={`${field} min-h-[96px]`} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Example: viewers pick which spice to taste, then I reveal the dish." /></div>
          <p className="text-sm text-fg-muted">We build it for the {category} category and add it to the kit if others can use it.</p>
          <button type="button" onClick={send} className="rounded-pill bg-sun px-5 py-3 font-display text-sm font-bold text-ink-950">Send request</button>
        </>
      ) : (
        <>
          <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-sm font-medium">Main brick</legend>
            <div className="flex flex-wrap gap-2">
              {MAIN.map((m) => <button key={m.id} type="button" aria-pressed={kind === m.id} onClick={() => setKind(m.id)} className={`rounded-pill border px-3.5 py-1.5 text-sm font-semibold ${kind === m.id ? 'border-sun bg-sun text-ink-950' : 'border-line hover:border-sky'}`}>{m.label}</button>)}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1.5"><label htmlFor="tb-prompt" className="text-sm font-medium">Question shown to viewers</label><input id="tb-prompt" className={field} value={prompt} maxLength={90} onChange={(ev) => setPrompt(ev.target.value)} /></div>
          {kind === 'choice' && (
            <div className="flex flex-col gap-2"><span className="text-sm font-medium">Options</span>
              {options.map((o, i) => <input key={i} aria-label={`Option ${i + 1}`} className={field} value={o} maxLength={32} placeholder={`Option ${i + 1}`} onChange={(ev) => setOptions(options.map((x, k) => (k === i ? ev.target.value : x)))} />)}
              <div className="flex gap-2">
                {options.length < 4 && <button type="button" onClick={() => setOptions([...options, ''])} className="rounded-pill border border-line px-3 py-1 text-sm hover:border-sky">Add option</button>}
                {options.length > 2 && <button type="button" onClick={() => setOptions(options.slice(0, -1))} className="rounded-pill border border-line px-3 py-1 text-sm hover:border-sky">Remove last</button>}
              </div>
            </div>
          )}
          <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-sm font-medium">Countdown</legend>
            <div className="flex gap-2">{[15, 20, 30, 45].map((s) => <button key={s} type="button" aria-pressed={seconds === s} onClick={() => setSeconds(s)} className={`rounded-pill border px-3.5 py-1.5 text-sm font-semibold tabular-nums ${seconds === s ? 'border-sky bg-sky text-ink-950' : 'border-line hover:border-sky'}`}>{s}s</button>)}</div>
          </fieldset>
          {kind !== 'lock' && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={useReveal} onChange={(ev) => setUseReveal(ev.target.checked)} className="accent-[var(--sun)]" /> Reveal after the countdown</label>
              {useReveal && <input aria-label="Reveal text" className={field} value={reveal} maxLength={90} onChange={(ev) => setReveal(ev.target.value)} placeholder="What gets unlocked" />}
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={lock} onChange={(ev) => setLock(ev.target.checked)} className="accent-[var(--sun)]" /> Pause the chat during the tool</label>
            </div>
          )}
          <div className="flex flex-col gap-1.5"><label htmlFor="tb-sound" className="text-sm font-medium">Sound cue (optional)</label><input id="tb-sound" className={field} value={sound} maxLength={24} onChange={(ev) => setSound(ev.target.value)} placeholder="Footsteps, heartbeat…" /></div>
          <p className="text-xs text-fg-muted">Bricks used: {bricks.map((b) => BRICKS.find((x) => x.id === b)!.label).join(' + ')}</p>
          <Preview def={def} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => save(false)} className="rounded-pill border border-sun px-5 py-2.5 font-display text-sm font-bold text-sun-soft hover:bg-sun hover:text-ink-950">Save tool</button>
            {onLaunch && <button type="button" onClick={() => save(true)} className="rounded-pill bg-sun px-5 py-2.5 font-display text-sm font-bold text-ink-950">Save and launch</button>}
          </div>
          {custom.length > 0 && <p className="text-xs text-fg-muted">{custom.length} saved in Your tools.</p>}
        </>
      )}
      {msg && <p className="fade-in text-sm font-semibold text-sky-soft" role="status">{msg}</p>}
    </div>
  )
}

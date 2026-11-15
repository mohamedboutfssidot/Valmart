// Manage the host's tools: turn each one on or off, pin favourites, set how long it runs, add your own.
// Used by the Studio "Live tools" page and, in small, by the launcher during a live.
import { useState } from 'react'
import { useLiveTools } from './store'
import { KITS, TOOLS, type Kit, type ToolDef } from './tools'
import { ToolBuilder } from './host'

const KIND: Record<string, string> = { choice: 'Vote', slider: 'Slider', pin: 'Tap the image', mission: 'Mission', lock: 'Chat lock', question: 'Questions' }
const SECONDS = [15, 20, 30, 45, 60]

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-sky-deep' : 'bg-ink-700'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

export function StarButton({ on, onChange, name }: { on: boolean; onChange: () => void; name: string }) {
  return <button type="button" aria-pressed={on} aria-label={`${on ? 'Remove' : 'Add'} ${name} ${on ? 'from' : 'to'} favourites`} onClick={onChange} className={`shrink-0 text-xl leading-none ${on ? 'text-sun' : 'text-line hover:text-fg-muted'}`}>{on ? '★' : '☆'}</button>
}

export function ToolRow({ t, canDelete = false }: { t: ToolDef; canDelete?: boolean }) {
  const { off, fav, secs, toggleTool, toggleFav, setSecs, removeTool } = useLiveTools()
  const on = !off.includes(t.id)
  const s = secs[t.id] ?? t.seconds
  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-3 ${on ? '' : 'opacity-60'}`} data-testid={`tool-${t.id}`}>
      <StarButton on={fav.includes(t.id)} onChange={() => toggleFav(t.id)} name={t.name} />
      <div className="min-w-[160px] flex-1"><p className="font-semibold">{t.name}</p><p className="text-sm text-fg-muted">{t.summary}. {KIND[t.kind]}.</p></div>
      <label className="flex items-center gap-2 text-sm text-fg-muted">Runs for
        <select value={s} onChange={(e) => setSecs(t.id, Number(e.target.value))} className="rounded-lg border border-line bg-ink-900 px-2 py-1 text-fg" aria-label={`Duration of ${t.name}`}>
          {[...new Set([...SECONDS, t.seconds])].sort((a, b) => a - b).map((n) => <option key={n} value={n}>{n} s</option>)}
        </select>
      </label>
      {canDelete && <button type="button" onClick={() => removeTool(t.id)} className="text-sm text-fg-muted underline hover:text-fg">Delete</button>}
      <Switch on={on} onChange={() => toggleTool(t.id)} label={`${t.name} ${on ? 'on' : 'off'}`} />
    </li>
  )
}

export function ToolManager({ category = 'Discovery' }: { category?: string }) {
  const { custom, off, resetTools, setKitOn } = useLiveTools()
  const [kit, setKit] = useState<Kit>('base')
  const [adding, setAdding] = useState(false)
  const tabs: { id: Kit; label: string }[] = [...KITS.map((k) => ({ id: k.id, label: k.label })), { id: 'custom', label: `Yours (${custom.length})` }]
  const list = kit === 'custom' ? custom : TOOLS.filter((t) => t.kit === kit)
  const all = [...TOOLS, ...custom]
  const onCount = all.filter((t) => !off.includes(t.id)).length
  const ids = list.map((t) => t.id)
  const allOn = ids.every((i) => !off.includes(i))
  return (
    <div className="flex flex-col gap-5" data-testid="tool-manager">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg"><b data-testid="on-count">{onCount}</b> <span className="text-fg-muted">of {all.length} tools are on</span></p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => { setAdding((v) => !v) }} className="rounded-pill bg-sun px-4 py-2 text-sm font-bold text-ink-950 hover:bg-sun-soft" data-testid="add-tool">{adding ? 'Close' : 'Add a tool'}</button>
          <button type="button" onClick={resetTools} className="rounded-pill border border-line px-4 py-2 text-sm font-semibold hover:border-sky-deep">Reset</button>
        </div>
      </div>
      {adding && <div className="rounded-card border border-line bg-ink-800 p-4" data-testid="builder-panel"><ToolBuilder category={category} onDone={() => { setAdding(false); setKit('custom') }} /></div>}
      <div role="tablist" aria-label="Tool kits" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line">
        {tabs.map((t) => <button key={t.id} role="tab" type="button" aria-selected={kit === t.id} onClick={() => setKit(t.id)} className={`-mb-px shrink-0 border-b-2 py-2.5 text-[15px] font-semibold ${kit === t.id ? 'border-sky-deep text-fg' : 'border-transparent text-fg-muted hover:text-fg'}`}>{t.label}</button>)}
      </div>
      {list.length === 0 ? <p className="text-fg-muted">Nothing here yet. Tap Add a tool to build one.</p> : (
        <div>
          <div className="mb-1 flex items-center justify-between text-sm text-fg-muted"><span>{KITS.find((k) => k.id === kit)?.blurb ?? 'Tools you built'}</span><button type="button" onClick={() => setKitOn(ids, !allOn)} className="font-semibold text-sky-deep hover:underline">{allOn ? 'Turn all off' : 'Turn all on'}</button></div>
          <ul>{list.map((t) => <ToolRow key={t.id} t={t} canDelete={kit === 'custom'} />)}</ul>
        </div>
      )}
      <p className="text-sm text-fg-muted">Tools that are off never appear in your launcher or in the automatic suggestions. The star pins a tool to the Favourites tab during a live.</p>
    </div>
  )
}

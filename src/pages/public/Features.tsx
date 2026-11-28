import { useState } from 'react'
import { Button } from '../../components/ui'
import { GUIDE } from '../../data/guide'
import { BRICKS, KITS, MODES, MODE_NOTE, TOOLS } from '../../live/tools'
import { Band, Rows, Seg } from './ui2'

const KIND: Record<string, string> = { choice: 'Vote', slider: 'Slider', pin: 'Tap the video', mission: 'Mission', lock: 'Chat lock', question: 'Questions' }

export default function Features() {
  const [g, setG] = useState(GUIDE[0].id)
  const [kit, setKit] = useState<string>('base')
  const group = GUIDE.find((x) => x.id === g)!
  const tools = TOOLS.filter((t) => t.kit === kit)
  return (
    <div className="flex flex-col gap-24 md:gap-32">
      <header className="stagger flex max-w-[68ch] flex-col gap-4">
        <p className="w-fit rounded-full border border-line px-3.5 py-1 text-sm font-medium text-sky-soft">Features</p>
        <h1 className="text-3xl sm:text-5xl">What you can do on Valmart</h1>
        <p className="text-lg text-fg-muted">Pick an area. Open a line.</p>
      </header>

      <section className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14" data-testid="guide">
        <div role="tablist" aria-label="Areas" aria-orientation="vertical" className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible lg:sticky lg:top-24">
          {GUIDE.map((x) => <button key={x.id} role="tab" type="button" aria-selected={g === x.id} onClick={() => setG(x.id)} className={`shrink-0 rounded-full border px-4 py-2 text-left font-display text-lg font-bold transition-colors lg:rounded-none lg:border-0 lg:border-l-2 lg:py-3 ${g === x.id ? 'border-sky text-fg' : 'border-line text-fg-muted hover:text-fg lg:border-line'}`}>{x.label}</button>)}
        </div>
        <div key={g} className="fade-in flex min-w-0 flex-col gap-5"><p className="text-xl text-fg-muted">{group.intro}</p><Rows items={group.items} /></div>
      </section>

      <Band eyebrow="Live tools" title={`${TOOLS.length} tools, four kits`} hint="The host launches one, the room answers, the result shows live.">
        <ul className="flex flex-wrap gap-x-10 gap-y-3 text-fg-muted">{MODES.map((m) => <li key={m}><b className="text-fg">{m}</b> · {MODE_NOTE[m]}</li>)}</ul>
        <Seg options={KITS.map((k) => k.label)} value={KITS.find((k) => k.id === kit)!.label} onChange={(l) => setKit(KITS.find((k) => k.label === l)!.id)} label="Tool kits" />
        <ul key={kit} className="fade-in divide-y divide-line border-y border-line" data-testid="tool-list">
          {tools.map((t) => <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3"><span><b className="font-display text-lg">{t.name}</b><span className="ml-3 text-fg-muted">{t.summary}</span></span><span className="text-sm text-sky">{KIND[t.kind]}</span></li>)}
        </ul>
        <p className="text-fg-muted">Hosts build their own from {BRICKS.length} bricks: {BRICKS.map((b) => b.label).join(', ')}.</p>
      </Band>

      <section className="flex flex-col items-start gap-5 border-t border-line pt-12"><h2 className="max-w-[18ch] text-4xl font-semibold leading-tight sm:text-6xl">See it for yourself</h2><div className="flex gap-3"><Button to="/signin?mode=signup" variant="sun">Create a free account</Button><Button to="/viewers" variant="ghost">For viewers</Button></div></section>
    </div>
  )
}

import type { ReactNode } from 'react'
import { CATEGORIES, CITIES } from '../../../data/mock'
import { LANGUAGES, SORTS, toggle, type Filters } from './filters'

function Pill({ on, onClick, children, big }: { on: boolean; onClick: () => void; children: ReactNode; big?: boolean }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`shrink-0 rounded-pill border font-semibold transition active:scale-95 ${big ? 'px-4 py-2.5 text-[15px]' : 'px-3.5 py-1.5 text-sm'} ${on ? 'border-sky bg-sky text-ink-950' : 'border-line bg-ink-800 text-fg hover:border-sky'}`}>{children}</button>
  )
}
function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-0.5 text-sm font-bold">{title}{hint && <span className="ml-2 font-normal text-fg-muted">{hint}</span>}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

export function FilterPanel({ f, set, big = false }: { f: Filters; set: (p: Partial<Filters>) => void; big?: boolean }) {
  const P = (p: { on: boolean; onClick: () => void; children: ReactNode }) => <Pill {...p} big={big} />
  return (
    <div className="flex flex-col gap-5">
      <Group title="Show">
        {([['all', 'Everything'], ['live', 'Live now'], ['replays', 'Replays']] as const).map(([k, l]) => <P key={k} on={f.type === k} onClick={() => set({ type: k })}>{l}</P>)}
      </Group>
      <Group title="Made for me">
        <P on={f.mine} onClick={() => set({ mine: !f.mine })}>My interests</P>
        <P on={f.following} onClick={() => set({ following: !f.following })}>Hosts and cities I follow</P>
        <P on={f.allAges} onClick={() => set({ allAges: !f.allAges })}>All ages only</P>
        <P on={f.fresh} onClick={() => set({ fresh: !f.fresh })}>Just started</P>
        <P on={f.quiet} onClick={() => set({ quiet: !f.quiet })}>Small rooms</P>
      </Group>
      <Group title="Spoken language" hint="Captions can translate the rest">
        <P on={!f.lang} onClick={() => set({ lang: null })}>Any</P>
        {LANGUAGES.map((l) => <P key={l} on={f.lang === l} onClick={() => set({ lang: f.lang === l ? null : l })}>{l}</P>)}
      </Group>
      <Group title="Topic" hint="Pick several">
        <P on={!f.cats.length} onClick={() => set({ cats: [] })}>All</P>
        {CATEGORIES.map((c) => <P key={c} on={f.cats.includes(c)} onClick={() => set({ cats: toggle(f.cats, c) })}>{c}</P>)}
      </Group>
      <Group title="City" hint="Pick several">
        <P on={!f.cities.length} onClick={() => set({ cities: [] })}>Anywhere</P>
        {CITIES.map((c) => <P key={c.id} on={f.cities.includes(c.id)} onClick={() => set({ cities: toggle(f.cities, c.id) })}>{c.name}</P>)}
      </Group>
      <Group title="Sort by">
        {SORTS.map(([k, l]) => <P key={k} on={f.sort === k} onClick={() => set({ sort: k })}>{l}</P>)}
      </Group>
    </div>
  )
}

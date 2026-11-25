import { CATEGORIES, CITIES } from '../data/mock'
import { Sheet } from './Sheet'

export type ExploreFilters = { following: boolean; city: string | null; category: string | null; sort: 'viewers' | 'newest' }
export const noFilters: ExploreFilters = { following: false, city: null, category: null, sort: 'viewers' }
export const countFilters = (f: ExploreFilters) => (f.following ? 1 : 0) + (f.city ? 1 : 0) + (f.category ? 1 : 0) + (f.sort !== 'viewers' ? 1 : 0)

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={`vm-fpill ${on ? 'vm-fpill-on' : ''}`}>{children}</button>
}
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="vm-fblock"><legend>{title}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>
}

/** Filters bottom sheet for Explore: blocks with small titles, compact pills, sticky footer. */
export function FiltersSheet({ f, onChange, onClose, results }: { f: ExploreFilters; onChange: (f: ExploreFilters) => void; onClose: () => void; results: number }) {
  const set = (p: Partial<ExploreFilters>) => onChange({ ...f, ...p })
  return (
    <Sheet title="Filters" onClose={onClose}>
      <div className="vm-fsheet" role="group" aria-label="Filters">
        <Block title="Made for me"><Pill on={f.following} onClick={() => set({ following: !f.following })}>Hosts I follow</Pill></Block>
        <Block title="Sort by">
          <Pill on={f.sort === 'viewers'} onClick={() => set({ sort: 'viewers' })}>Most watched</Pill>
          <Pill on={f.sort === 'newest'} onClick={() => set({ sort: 'newest' })}>Newest</Pill>
        </Block>
        <Block title="City">{CITIES.map((c) => <Pill key={c.id} on={f.city === c.id} onClick={() => set({ city: f.city === c.id ? null : c.id })}>{c.name}</Pill>)}</Block>
        <Block title="Topic">{CATEGORIES.map((c) => <Pill key={c} on={f.category === c} onClick={() => set({ category: f.category === c ? null : c })}>{c}</Pill>)}</Block>
        <div className="vm-ffoot">
          <button type="button" onClick={() => onChange(noFilters)} data-testid="filters-clear">Clear</button>
          <button type="button" onClick={onClose} data-testid="filters-show">Show {results} results</button>
        </div>
      </div>
    </Sheet>
  )
}

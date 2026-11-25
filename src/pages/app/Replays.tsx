import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES, type Category } from '../../data/mock'
import { useDemo } from '../../store'
import { Chip } from '../../components/ui'
import { CatE3 } from '../../live/e3d'
import { ReplayCard, ReplayPlayer, useOpenReplays } from '../../features/Replays'
import { useReplays } from '../../replays'
import { Empty } from '../../features/kit'

export function ReplaysPage() {
  const user = useDemo((s) => s.user)
  const all = useOpenReplays()
  const [cat, setCat] = useState<Category | 'All'>('All')
  const [sort, setSort] = useState<'new' | 'soon' | 'views'>('new')
  const left = (r: (typeof all)[number]) => 48 - (Date.now() - r.endedAt) / 36e5
  const ending = all.filter((r) => left(r) < 6).length
  const list = all
    .filter((r) => cat === 'All' || r.category === cat)
    .sort((a, b) => (sort === 'soon' ? left(a) - left(b) : sort === 'views' ? b.views - a.views : b.endedAt - a.endedAt))
  const cats = CATEGORIES.filter((c) => all.some((r) => r.category === c))
  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Replays</h1>
        <p className="text-fg-muted">Missed a live? Watch it again for 48 hours after it ended.{ending > 0 && <> <button type="button" onClick={() => setSort('soon')} className="font-semibold text-sun-soft underline">{ending} {ending === 1 ? 'replay ends' : 'replays end'} within 6 hours</button></>}</p>
      </header>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sort replays">
        <span className="text-sm text-fg-muted">Sort by</span>
        {([['new', 'Newest'], ['soon', 'Ending soon'], ['views', 'Most watched']] as const).map(([k, l]) => <Chip key={k} active={sort === k} onClick={() => setSort(k)}>{l}</Chip>)}
        <span className="ml-auto text-sm text-fg-muted tabular-nums">{list.length} replays</span>
      </div>
      <div className="scroll-x flex gap-2" role="tablist" aria-label="Replay categories">
        <Chip active={cat === 'All'} onClick={() => setCat('All')}>All</Chip>
        {cats.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}><span className="inline-flex items-center gap-1.5"><CatE3 c={c} size={16} />{c}</span></Chip>)}
      </div>
      {list.length ? (
        <div className="stagger grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{list.map((r) => <ReplayCard key={r.id} r={r} to={`/app/replay/${r.id}`} me={user?.name} />)}</div>
      ) : <Empty>No replay in this category right now.</Empty>}
    </div>
  )
}

export function ReplayWatch() {
  const { id } = useParams(); const nav = useNavigate()
  const user = useDemo((s) => s.user)
  const r = useReplays((s) => s.list.find((x) => x.id === id))
  const more = useOpenReplays().filter((x) => x.id !== id && r && x.hostId === r.hostId).slice(0, 3)
  if (!r) return <Empty>This replay does not exist.</Empty>
  return (
    <div className="flex max-w-[980px] flex-col gap-6">
      <button type="button" onClick={() => nav(-1)} className="self-start text-sm text-sky hover:underline">Back</button>
      <ReplayPlayer r={r} me={user?.name} />
      {r.hostId !== 'me' && <Link to={`/app/host/${r.hostId}`} className="self-start text-sm font-semibold text-sky hover:underline">See the host profile</Link>}
      {more.length > 0 && (
        <section className="flex flex-col gap-3"><h2 className="text-lg font-bold">More from this host</h2>
          <div className="grid gap-5 sm:grid-cols-3">{more.map((x) => <ReplayCard key={x.id} r={x} to={`/app/replay/${x.id}`} me={user?.name} />)}</div>
        </section>
      )}
    </div>
  )
}
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { CatIcon } from '../../components/icons2'
import { VideoSlot } from '../../components/VideoSlot'
import { CATEGORIES, STREAMS, categoryBySlug, formatCount, slugOf, type Category } from '../../data/mock'
import { StreamCard } from '../../components/StreamCard'
import { Button, Chip } from '../../components/ui'

const BLURB: Record<string, string> = {
  'Discovery': 'First visits and open exploration, with the audience picking the route.',
  'Adventure': 'Trails, deserts and climbs on the move.',
  'Horror': 'Dark history and eerie places, told on the spot.',
  'Night Exploration': 'Cities after dark, from neon crossings to quiet piazzas.',
  'Cultural Tour': 'Temples, markets and traditions explained by people who live there.',
  'Food Journey': 'Street food, markets and tastings, stop by stop.',
  'Nature Walk': 'Parks, gardens and mountain paths in real time.',
  'Travel Guide': 'Practical walks that help you plan a real trip.',
  'Hidden Places': 'Courtyards, souks and corners most visitors miss.',
  'Survival-Style': 'Budget and practical know-how for getting by in a new country.',
  'Luxury': 'High-end shopping, hotels and design.',
  'Urban Exploration': 'Street art, rooftops and neighborhoods off the tourist map.',
  'Festival / Event': 'Parades, races and rehearsals as they happen.',
  'Educational Tour': 'History and architecture with context you can ask about.',
  'Relax / Ambient': 'Slow streams to unwind, with ambient sound and no hurry.',
}

const MORE: Record<string, string> = {
  'Street Food Market': 'Night markets and food stalls, one bite at a time.',
  'Wildlife & Safari': 'Animals and wild places, filmed with guides.',
  'Nightlife & Music': 'Live music, bars and late-night streets.',
  'Art & Museums': 'Galleries, studios and museums with someone who knows them.',
  'History & Heritage': 'Old towns and landmarks, with the stories behind them.',
  'Sports & Fitness': 'Runs, rides and matches, on the move.',
  'Weather & Storms': 'Storms, snow and sunrises as they happen.',
  'A Day with a Local': 'Follow a local through a normal day.',
  'Transport Journey': 'Trains, ferries and road trips, seat by seat.',
  'Language & Lessons': 'Learn useful phrases while you walk.',
}
export const GROUPS: { title: string; items: Category[] }[] = [
  { title: 'Explore the city', items: ['Discovery', 'Urban Exploration', 'Hidden Places', 'Night Exploration', 'Travel Guide', 'A Day with a Local', 'Transport Journey'] },
  { title: 'Food, culture and music', items: ['Food Journey', 'Street Food Market', 'Cultural Tour', 'History & Heritage', 'Art & Museums', 'Festival / Event', 'Nightlife & Music', 'Educational Tour', 'Language & Lessons'] },
  { title: 'Nature and adventure', items: ['Adventure', 'Nature Walk', 'Wildlife & Safari', 'Weather & Storms', 'Sports & Fitness', 'Survival-Style', 'Horror'] },
  { title: 'Slow and premium', items: ['Luxury', 'Relax / Ambient'] },
]

export function CategoriesIndex() {
  const [q, setQ] = useState('')
  const [only, setOnly] = useState<'all' | 'live'>('all')
  const info = (c: Category) => { const list = STREAMS.filter((s) => s.category === c); return { list, watching: list.reduce((n, s) => n + s.viewers, 0) } }
  const match = (c: Category) => (!q || c.toLowerCase().includes(q.toLowerCase()) || (BLURB[c] ?? MORE[c] ?? '').toLowerCase().includes(q.toLowerCase())) && (only === 'all' || info(c).list.length > 0)
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter(match) })).filter((g) => g.items.length)
  const liveCats = CATEGORIES.filter((c) => info(c).list.length > 0).length
  return (
    <div className="flex flex-col gap-8" data-testid="categories-page">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold sm:text-[28px]">Categories</h1>
          <p className="text-fg-muted">{CATEGORIES.length} types of experience. {liveCats} have a live right now.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] max-w-[380px] flex-1">
            <span className="sr-only">Search categories</span>
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a category" className="h-11 w-full rounded-full border border-line bg-ink-800 pl-10 pr-4 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none" />
          </label>
          <Chip active={only === 'all'} onClick={() => setOnly('all')}>All</Chip>
          <Chip active={only === 'live'} onClick={() => setOnly('live')}>Live now</Chip>
        </div>
      </header>
      {!groups.length && <p className="rounded-card border border-dashed border-line p-6 text-center text-fg-muted">No category matches. Try another word.</p>}
      {groups.map((g) => (
        <section key={g.title} className="flex flex-col gap-3" aria-label={g.title}>
          <h2 className="text-xl font-semibold">{g.title}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((c) => {
              const { list, watching } = info(c)
              const top = [...list].sort((x, y) => y.viewers - x.viewers)[0]
              return (
                <li key={c}>
                  <Link to={`/app/category/${slugOf(c)}`} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-ink-800 hover:border-sky" data-testid="category-card">
                    <span className="relative block">
                      {top
                        ? <VideoSlot stream={top} showLabel={false} className="!rounded-none" />
                        : <span className="grid aspect-video place-items-center bg-ink-700 text-fg-muted"><CatIcon c={c} size={40} /></span>}
                      <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink-950/75 text-fg backdrop-blur"><CatIcon c={c} size={18} /></span>
                      {list.length > 0 && <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold text-white"><i className="live-dot" style={{ width: 6, height: 6 }} />{list.length} live</span>}
                    </span>
                    <span className="flex flex-1 flex-col gap-1 p-4">
                      <span className="font-display text-lg font-bold">{c}</span>
                      <span className="text-sm text-fg-muted">{BLURB[c] ?? MORE[c]}</span>
                      <span className="mt-1 text-xs font-semibold text-sky">{list.length ? `${formatCount(watching)} watching` : 'No live right now'}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function CategoryPage() {
  const { slug } = useParams()
  const cat = categoryBySlug(slug)
  if (!cat) {
    return (
      <div className="rounded-card border border-line bg-ink-800 p-8 text-center">
        <h1 className="text-2xl font-bold">Unknown category</h1>
        <div className="mt-5"><Button to="/app/categories">All categories</Button></div>
      </div>
    )
  }
  const list = STREAMS.filter((s) => s.category === cat)
  const watching = list.reduce((n, s) => n + s.viewers, 0)
  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2">
        <Link to="/app/categories" className="w-fit text-sm text-sky hover:underline">All categories</Link>
        <h1 className="text-2xl font-bold sm:text-[28px]">{cat}</h1>
        <p className="max-w-[60ch] text-fg-muted">{BLURB[cat]} {list.length} live now, {formatCount(watching)} watching.</p>
      </header>
      <div className="stagger grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => <StreamCard key={s.id} stream={s} />)}
      </div>
    </div>
  )
}

import { Link, useParams } from 'react-router-dom'
import { CATEGORIES, STREAMS, categoryBySlug, formatCount, slugOf } from '../../data/mock'
import { StreamCard } from '../../components/StreamCard'
import { Button } from '../../components/ui'

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

export function CategoriesIndex() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-[28px]">Categories</h1>
        <p className="text-fg-muted">{CATEGORIES.length} types of experience, {STREAMS.length} sessions live now.</p>
      </header>
      <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const list = STREAMS.filter((s) => s.category === c)
          const watching = list.reduce((n, s) => n + s.viewers, 0)
          const art = list[0]?.art
          return (
            <li key={c}>
              <Link to={`/app/category/${slugOf(c)}`} className="lift group flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-ink-800 hover:border-sky">
                <span className="block h-20 transition-transform duration-500 group-hover:scale-105" style={{ background: art ? `linear-gradient(135deg, ${art.from}, ${art.to})` : 'var(--ink-700)' }} aria-hidden="true" />
                <span className="flex flex-1 flex-col gap-1 p-4">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-lg font-bold">{c}</span>
                    <span className="shrink-0 text-sm text-fg-muted tabular-nums">{list.length} live</span>
                  </span>
                  <span className="text-sm text-fg-muted">{BLURB[c]}</span>
                  <span className="mt-1 text-xs text-sun-soft">{formatCount(watching)} watching</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
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

import { useState } from 'react'
import { CATEGORIES, STREAMS } from '../data/mock'
import { Page } from './Screens'

/** Category picked on the Categories tab, read once by Explore when it opens. */
export const pendingCategory: { value: string | null } = { value: null }

const EMOJI: Record<string, string> = {
  Discovery: '🧭', Adventure: '🏔️', Horror: '👻', 'Night Exploration': '🌙', 'Cultural Tour': '🏛️', 'Food Journey': '🍜',
  'Nature Walk': '🌿', 'Travel Guide': '🧳', 'Hidden Places': '🗝️', 'Survival-Style': '🔥', Luxury: '💎', 'Urban Exploration': '🏙️',
  'Festival / Event': '🎉', 'Educational Tour': '🎓', 'Relax / Ambient': '🌊', 'Street Food Market': '🥘', 'Wildlife & Safari': '🦁',
  'Nightlife & Music': '🎶', 'Art & Museums': '🎨', 'History & Heritage': '📜', 'Sports & Fitness': '🏃', 'Weather & Storms': '⛈️',
  'A Day with a Local': '🤝', 'Transport Journey': '🚆', 'Language & Lessons': '💬',
}

/** Categories tab: search, live counts, tap to open Explore on that category. */
export function CategoriesTab({ onPick }: { onPick: (category: string) => void }) {
  const [q, setQ] = useState('')
  const rows = CATEGORIES
    .map((c, i) => ({ c, i, n: STREAMS.filter((s) => s.category === c).length }))
    .filter((x) => x.c.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.n - a.n || a.i - b.i)
  return (
    <Page title="Categories" sub={`${CATEGORIES.length} kinds of trips · ${STREAMS.length} live now`}>
      <div className="flex flex-col gap-4" data-testid="cats-tab">
        <label className="vm-cat-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a category" aria-label="Find a category" />
        </label>
        {rows.length === 0 ? <p className="py-8 text-center text-sm text-fg-muted">No category matches.</p> : (
          <div className="grid grid-cols-2 gap-2.5">
            {rows.map(({ c, i, n }) => (
              <button key={c} type="button" onClick={() => { pendingCategory.value = c; onPick(c) }} data-testid="cat-card" className={`vm-cat ${n ? 'vm-cat-live' : ''}`} style={{ ['--h' as string]: (i * 47) % 360 }}>
                <span className="vm-cat-ico" aria-hidden="true">{EMOJI[c] ?? '✨'}</span>
                <span className="vm-cat-name">{c}</span>
                <span className="vm-cat-n">{n ? <><i className="live-dot" style={{ width: 6, height: 6 }} />{n} live now</> : 'Replays only'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Page>
  )
}

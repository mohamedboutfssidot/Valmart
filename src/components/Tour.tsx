import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_HOST } from '../data/demo'
import { useDemo } from '../store'

export const TOUR: { route: string; title: string; text: string; as?: 'host' }[] = [
  { route: '/', title: 'The public site', text: 'Visitors learn what Valmart is and can open three live previews without an account. Locals stream real walks, and anyone can join, talk to the host and vote on the route.' },
  { route: '/signin', title: 'One account for everything', text: 'People create an account or sign in. For this demo, the buttons at the bottom open ready-made accounts with sample history.' },
  { route: '/app', title: 'Discover', text: 'Inside the app there is no explaining, only content: picks based on interests, a map of live sessions and 25 categories in the left bar.', as: 'host' },
  { route: '/app/live/s2', title: 'The live room', text: 'Vote on the route, chat, send a gift, read live translation and save a moment.', as: 'host' },
  { route: '/studio', title: 'Studio, the host workspace', text: 'Studio is a separate workspace, opened from the left bar or the profile menu. Hosts get their overview, sessions, events, boosts and earnings here.', as: 'host' },
  { route: '/studio/go-live', title: 'Go live', text: 'A host picks a city and starts a session from their phone. Start one to see the audience vote and the earnings counter.', as: 'host' },
  { route: '/studio/earnings', title: 'Earnings', text: 'Gifts, paid events and boosts land in one ledger. Hosts pay nothing to join, only for visibility when they want it.', as: 'host' },
  { route: '/app/events/e1', title: 'Paid events', text: 'Scheduled walks with limited seats, sold as tickets and co-hosted by brands. Reserve a seat to see it in My trips.', as: 'host' },
  { route: '/app/plan', title: 'Plan', text: 'Free watches in 720p. Plus adds 1080p and 10 Look here per live. Premium adds unlimited Look here, bigger groups and priority events. Switch the plan and open a live room to see the quality change.', as: 'host' },
]

export function TourButton({ className = '' }: { className?: string }) {
  const { tourOpen, tourDone, setTour } = useDemo()
  const nav = useNavigate()
  // once someone has taken the tour the button is gone (it comes back after "Reset demo")
  if (tourDone && !tourOpen) return null
  return (
    <button
      type="button"
      onClick={() => { setTour(!tourOpen, 0); if (!tourOpen) nav(TOUR[0].route) }}
      aria-pressed={tourOpen}
      className={`rounded-pill border px-3.5 py-1.5 text-sm font-semibold transition-colors ${tourOpen ? 'border-sky bg-sky text-ink-950' : 'border-sky text-sky-soft hover:bg-ink-800'} ${className}`}
    >
      <span className="sm:hidden">Tour</span><span className="max-sm:hidden">Demo tour</span>
    </button>
  )
}

export function TourPanel() {
  const { tourOpen, tourStep, setTour, setStep, reset, user, signIn } = useDemo()
  const nav = useNavigate()
  const last = TOUR.length - 1

  const go = (n: number) => {
    const i = Math.min(last, Math.max(0, n))
    const target = TOUR[i]
    const cur = useDemo.getState().user
    if (target.as === 'host' && !cur?.isHost) signIn(DEMO_HOST)
    setStep(i)
    nav(target.route)
  }

  useEffect(() => {
    if (!tourOpen) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      if (e.key === 'ArrowRight') go(tourStep + 1)
      if (e.key === 'ArrowLeft') go(tourStep - 1)
      if (e.key === 'Escape') setTour(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!tourOpen) return null
  const s = TOUR[tourStep]

  return (
    <aside
      role="dialog"
      aria-label="Demo tour"
      className="pop-in fixed right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-card border border-sky bg-ink-900 p-4 shadow-2xl md:bottom-4"
      style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-sky">Step {tourStep + 1} of {TOUR.length}</p>
        <button type="button" onClick={() => setTour(false)} aria-label="Close the tour" className="-mr-1 -mt-1 h-7 w-7 rounded-full text-lg leading-none text-fg-muted hover:bg-ink-700 hover:text-fg">×</button>
      </div>
      <h2 className="mt-1 font-display text-lg font-bold leading-tight">{s.title}</h2>
      <p className="mt-1.5 text-[15px] text-fg-muted">{s.text}</p>
      <div className="mt-3 flex h-1 gap-1" aria-hidden="true">
        {TOUR.map((_, i) => <span key={i} className="h-full flex-1 rounded-full" style={{ background: i <= tourStep ? 'var(--sky)' : 'var(--ink-700)' }} />)}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" onClick={() => { reset(); nav(TOUR[0].route) }} className="text-sm text-fg-muted hover:text-fg hover:underline">
          Reset demo{user ? ' and sign out' : ''}
        </button>
        <div className="flex gap-2">
          <button type="button" disabled={tourStep === 0} onClick={() => go(tourStep - 1)} className="rounded-pill border border-line px-4 py-1.5 text-sm font-semibold hover:bg-ink-700 disabled:opacity-40">Back</button>
          {tourStep === last ? (
            <button type="button" onClick={() => setTour(false)} className="rounded-pill bg-sun px-5 py-1.5 font-display text-sm font-bold text-ink-950 hover:bg-sun-soft">Finish</button>
          ) : (
            <button type="button" onClick={() => go(tourStep + 1)} className="rounded-pill bg-sky px-5 py-1.5 font-display text-sm font-bold text-ink-950 hover:bg-sky-soft">Next</button>
          )}
        </div>
      </div>
    </aside>
  )
}

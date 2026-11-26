import { useEffect, useRef, useState } from 'react'
import { useDemo } from '../store'
import { Logo } from '../components/ui'
import { Watch } from './Watch'
import { Events, Hub } from './Hub'
import { CategoriesTab } from './Categories'
import '../mobile-extra.css'
import { STREAMS, streamById } from '../data/mock'
import { Explore } from './Screens'
import { Me } from './Settings'
import { StudioTab } from './Studio'
import { usePrefs } from './prefs'
import { Icon } from './icons'
import { AuthScreen, Onboarding, Splash, TrialSheet } from './Onboarding'
import { MobileRooms } from './Rooms'

type Tab = 'explore' | 'categories' | 'events' | 'hub' | 'studio' | 'me'

export default function MobileApp() {
  const user = useDemo((s) => s.user)
  const isPremium = useDemo((s) => s.isPremium)
  const [flow, setFlow] = useState<'splash' | 'onboard' | 'auth'>(user ? 'auth' : 'splash')
  const [offer, setOffer] = useState(false)
  const [offered, setOffered] = useState(false)
  useEffect(() => {
    if (!user || user.demo || isPremium || offered) return
    const t = window.setTimeout(() => { setOffer(true); setOffered(true) }, 2500)
    return () => window.clearTimeout(t)
  }, [user, isPremium, offered])
  const [rooms, setRooms] = useState(false)
  const [roomCode, setRoomCode] = useState<string | undefined>()
  const [tab, setTab] = useState<Tab>('explore')
  const [watching, setWatching] = useState<string | null>(null)
  const watch = (id: string) => setWatching(id)
  const stream = watching ? streamById(watching) ?? STREAMS[0] : null

  type TabDef = [Tab, string, Parameters<typeof Icon>[0]['name']]
  const tabs: TabDef[] = [
    ['explore', 'Explore', 'live'], ['categories', 'Categories', 'explore'],
    ...(user?.isHost ? [['studio', 'Studio', 'studio'] as TabDef] : []),
    ['hub', 'More', 'users'], ['me', 'Profile', 'me'],
  ]
  const current = tabs.some(([k]) => k === tab) ? tab : 'explore'
  const idx = tabs.findIndex(([k]) => k === current)
  const prev = useRef(idx)
  const dir = idx === prev.current ? 'fade-in' : idx > prev.current ? 'tab-from-right' : 'tab-from-left'
  useEffect(() => { prev.current = idx }, [idx])
  const reduce = usePrefs((st) => st.p.reduceMotion)

  return (
    <div className="yt vm-phone flex min-h-[100dvh] items-center justify-center gap-14 bg-[color:var(--stage)] sm:p-4">
      <aside className="hidden max-w-[300px] flex-col gap-3 lg:flex">
        <Logo className="h-8" />
        <h1 className="font-display text-3xl font-extrabold leading-tight">Valmart mobile</h1>
        <p className="text-fg-muted">The phone version of the prototype. Swipe up and down in Live, open the side buttons for chat, gifts and the route vote.</p>
        <p className="text-sm text-fg-muted">On the sign-in screen you can create an account or use the Nadia (viewer) and Léa (host) demo accounts. Everything is sample data.</p>
      </aside>
      <div className={`${reduce ? 'rm ' : ''}relative isolate flex h-[100vh] h-[100dvh] w-full flex-col overflow-hidden bg-ink-900 text-fg sm:h-[844px] sm:max-h-[calc(100dvh-32px)] sm:w-[390px] sm:rounded-[46px] sm:border-[10px] sm:border-ink-950 sm:shadow-[0_30px_80px_rgba(10,27,45,.35)]`}>
        <div className="pointer-events-none absolute left-1/2 top-2 z-[60] hidden h-6 w-24 -translate-x-1/2 rounded-full bg-black sm:block" />
        <div className="relative min-h-0 flex-1">
          {!user ? (
            flow === 'splash' ? <Splash onDone={() => setFlow('onboard')} />
              : flow === 'onboard' ? <Onboarding onDone={() => setFlow('auth')} />
              : <AuthScreen onBack={() => setFlow('onboard')} />
          ) : (
            <div key={current} className={`${dir} absolute inset-0`}>
              {current === 'explore' && <Explore onWatch={watch} onRooms={() => { setRoomCode(undefined); setRooms(true) }} onLive={(r) => { setRoomCode(r); setRooms(true) }} />}
              {current === 'categories' && <CategoriesTab onPick={() => setTab('explore')} />}
              {current === 'events' && <Events />}
              {current === 'hub' && <Hub onWatch={watch} />}
              {current === 'studio' && <StudioTab />}
              {current === 'me' && <Me onTrial={() => setOffer(true)} onRooms={() => { setRoomCode(undefined); setRooms(true) }} />}
            </div>
          )}
          {user && stream && <Watch key={stream.id} stream={stream} onClose={() => setWatching(null)} onSwitch={watch} onTrial={() => setOffer(true)} />}
          {user && offer && <TrialSheet onClose={() => setOffer(false)} />}
          {user && rooms && <MobileRooms key={roomCode ?? 'entry'} initialRoom={roomCode} onClose={() => setRooms(false)} />}
        </div>
        {user && !stream && (
          <nav className="relative z-50 shrink-0 border-t border-line bg-ink-800/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Main">
            <div className="relative flex">
              <span className="absolute top-0 h-[3px] rounded-b-full bg-sky transition-transform duration-300 [transition-timing-function:cubic-bezier(.3,1.3,.5,1)]" style={{ width: `${100 / tabs.length}%`, transform: `translateX(${idx * 100}%)` }}><span className="mx-auto block h-full w-7 rounded-b-full bg-sky shadow-[0_0_14px_rgba(36,177,244,.8)]" /></span>
              {tabs.map(([k, label, icon]) => (
                <button key={k} type="button" onClick={() => setTab(k)} aria-current={current === k ? 'page' : undefined} aria-label={label} className={`flex flex-1 flex-col items-center gap-1 pb-2 pt-3 transition-colors duration-300 active:scale-90 ${current === k ? 'text-sky' : 'text-fg-muted'}`}>
                  <Icon name={icon} size={22} />
                  <span className={`text-[10.5px] font-semibold leading-none transition-all duration-300 ${current === k ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}

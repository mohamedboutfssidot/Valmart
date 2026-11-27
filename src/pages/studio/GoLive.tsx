import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, CITIES, STREAMS, type Category, type Stream } from '../../data/mock'
import { useLiveSim } from '../../hooks/useLiveSim'
import { Link } from 'react-router-dom'
import { Button, Chip, LiveBadge } from '../../components/ui'
import { useDemo } from '../../store'
import { giftUsd } from '../../data/demo'
import { VideoSlot } from '../../components/VideoSlot'
import { ChatPanel } from '../../components/ChatPanel'
import { VoteCard } from '../../components/VoteCard'
import { kitFor, KITS, TOOLS } from '../../live/tools'
import { useToolEngine } from '../../live/useToolEngine'
import { useMode } from '../../live/store'
import { PinLayer, ToolCard, VideoEffects, GiftToast } from '../../live/ui'
import { ToolBuilder, ToolLauncher } from '../../live/host'
import { HostModePicker, OneButton, TeamPanel, WalkingSwitch, useSuggestion, type HostMode } from '../../live/director'
import { createRoom } from '../../rooms/api'
import { HostRoom } from '../../rooms/screens'
import { useResultVoice, useVoice, VoiceBadge, VoiceToggle } from '../../live/tts'

interface Config { cityId: string; title: string; place: string; category: Category; hostMode: HostMode }
interface Summary { seconds: number; peak: number; gifts: number; coins: number }

const usd = (coins: number) => `$${giftUsd(coins).toFixed(2)}`
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const POLICY: Record<'exact' | 'area' | 'secret', { note: string }> = {
  exact: { note: 'Exact places, route sketch and photos are on.' },
  area: { note: 'Only the area is named. Exact spot kept for safety.' },
  secret: { note: 'The spot stays secret: no map, no exact place, no photos.' },
}

const field = 'w-full rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-[15px] placeholder:text-fg-muted focus:border-sky focus:outline-none'

export default function GoLive() {
  const user = useDemo((st) => st.user)
  if (!user?.isHost) return <BecomeHost />
  return <Setup defaultCity={user.hostCity ?? 'paris'} />
}

function BecomeHost() {
  const becomeHost = useDemo((st) => st.becomeHost)
  const [city, setCity] = useState('paris')
  const [langs, setLangs] = useState<string[]>(['English'])
  const ALL = ['English', 'French', 'Spanish', 'Arabic', 'Japanese', 'Italian', 'Turkish', 'Portuguese']
  return (
    <div className="flex max-w-[620px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Set up your host profile</h1>
        <p className="text-fg-muted">Choose where you stream and the languages you speak. Then you can go live.</p>
      </header>
      <form className="flex flex-col gap-5 rounded-card border border-line bg-ink-800 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); becomeHost(city, langs.length ? langs : ['English']) }}>
        <div className="flex flex-col gap-2">
          <label htmlFor="bh-city" className="text-sm font-medium">Your city</label>
          <select id="bh-city" className={field} value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
          </select>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Languages</legend>
          <div className="flex flex-wrap gap-2">
            {ALL.map((l) => <Chip key={l} active={langs.includes(l)} onClick={() => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]))}>{l}</Chip>)}
          </div>
        </fieldset>
        <button type="submit" className="rounded-pill bg-sun px-6 py-3 font-display text-base font-bold text-ink-950 hover:bg-sun-soft">Become a host</button>
        <p className="text-sm text-fg-muted">Free to join. All you need is a camera.</p>
      </form>
    </div>
  )
}

function Setup({ defaultCity }: { defaultCity: string }) {
  const endSession = useDemo((st) => st.endSession)
  const sessions = useDemo((st) => st.sessions)
  const user = useDemo((st) => st.user)
  const [phase, setPhase] = useState<'setup' | 'live' | 'real' | 'ended'>('setup')
  const [real, setReal] = useState<{ room: string; key: string; team: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [cfg, setCfg] = useState<Config>({ cityId: defaultCity, title: 'Evening walk along the Seine', place: 'Pont de l’Alma', category: 'Discovery', hostMode: 'auto' })
  const [summary, setSummary] = useState<Summary | null>(null)

  // real live: the room is created with the details above, then it appears in "Live now" for every viewer
  const startReal = async () => {
    const c = CITIES.find((x) => x.id === cfg.cityId)!
    setBusy(true); setErr('')
    try {
      const made = await createRoom({ title: cfg.title, city: c.name, country: c.country, category: cfg.category, host: user?.name || 'Host' })
      const team = cfg.hostMode === 'team'
      setReal({ room: made.room, key: team ? made.keys.control : made.keys.host, team })
      setPhase('real')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not start the live') }
    finally { setBusy(false) }
  }

  if (phase === 'real' && real) {
    return (
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1"><h1 className="text-2xl font-extrabold sm:text-3xl">{cfg.title}</h1><p className="text-fg-muted">{cfg.place}, {CITIES.find((c) => c.id === cfg.cityId)?.name} · you are live in “Live now”.</p></header>
        <HostRoom room={real.room} role={real.team ? 'control' : 'host'} hostKey={real.key} hostMode={cfg.hostMode} category={cfg.category} autoStart={!real.team} surface="web" onLeave={() => { setReal(null); setPhase('setup') }} />
      </div>
    )
  }
  if (phase === 'live') {
    return <Studio cfg={cfg} onEnd={(s) => { endSession({ title: cfg.title, cityId: cfg.cityId, seconds: s.seconds, peak: s.peak, gifts: s.gifts, coins: s.coins }); setSummary(s); setPhase('ended') }} />
  }
  if (phase === 'ended' && summary) {
    return (
      <div className="flex max-w-[640px] flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Session complete</h1>
          <p className="text-fg-muted">Here is how your walk went.</p>
        </header>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Duration', clock(summary.seconds)],
            ['Peak audience', String(summary.peak)],
            ['Gifts received', String(summary.gifts)],
            ['You earned', usd(summary.coins)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-card border border-line bg-ink-800 p-4">
              <dt className="text-sm text-fg-muted">{k}</dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="rounded-card border border-line bg-ink-800 px-4 py-3 text-sm" data-testid="replay-made"><b>Your replay is ready.</b> Viewers can watch it for 48 hours. Add a note or pin it from Replays.</p>
        <p className="text-sm text-fg-muted">Added to your earnings. Sample rate: 100 coins equal $1 and you keep 70%.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setPhase('setup')}>Plan another session</Button>
          <Button to="/studio/earnings" variant="ghost">Open earnings</Button>
        </div>
      </div>
    )
  }

  const city = CITIES.find((c) => c.id === cfg.cityId)!
  const kit = kitFor(cfg.category)
  const policy = kit === 'hidden' ? 'secret' : kit === 'fear' || kit === 'adventure' || kit === 'nature' ? 'area' : 'exact'

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Go live</h1>
        <p className="max-w-[60ch] text-fg-muted">Set up your walk, check your camera and start.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <form
          className="flex min-w-0 flex-col gap-5 rounded-card border border-line bg-ink-800 p-5 sm:p-6"
          onSubmit={(e) => { e.preventDefault(); void startReal() }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="host-city" className="text-sm font-medium">City</label>
            <select id="host-city" className={field} value={cfg.cityId} onChange={(e) => setCfg({ ...cfg, cityId: e.target.value })}>
              {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="host-title" className="text-sm font-medium">Session title</label>
            <input id="host-title" className={field} value={cfg.title} maxLength={80} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} placeholder="What will you show?" required />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="host-place" className="text-sm font-medium">Starting point</label>
            <input id="host-place" className={field} value={cfg.place} maxLength={60} onChange={(e) => setCfg({ ...cfg, place: e.target.value })} placeholder="A landmark or street" required />
            <p className="flex items-start gap-2 rounded-xl bg-ink-700/60 px-3 py-2 text-sm" data-testid="place-preview">
              <span aria-hidden="true">👁</span>
              <span><b>Viewers will see:</b> {policy === 'exact' ? `${cfg.place || 'your starting point'}, ${city.name}` : policy === 'area' ? `${city.name}, ${city.country}` : city.country}. <span className="text-fg-muted">{policy === 'exact' ? 'This type shows the place and a map.' : policy === 'area' ? 'This type shows only the area, never the exact spot.' : 'This type never shows the place. Only the country.'}</span></span>
            </p>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Type of experience</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => ['Discovery', 'Cultural Tour', 'Food Journey', 'Night Exploration', 'Hidden Places', 'Travel Guide', 'Horror'].includes(c)).map((c) => (
                <Chip key={c} active={cfg.category === c} onClick={() => setCfg({ ...cfg, category: c })}>{c}</Chip>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-2 rounded-xl border border-line px-3.5 py-3" data-testid="kit-preview">
            <p className="text-sm"><b>Tools for this type</b> <span className="text-fg-muted">· {KITS.find((k) => k.id === kit)?.label}</span></p>
            <div className="flex flex-wrap gap-1.5">{TOOLS.filter((t) => t.kit === 'base' || t.kit === kit).map((t) => <span key={t.id} className="rounded-pill bg-ink-700 px-2.5 py-1 text-xs font-semibold">{t.name}</span>)}</div>
            <p className="text-xs text-fg-muted">{POLICY[kit === 'hidden' ? 'secret' : kit === 'fear' || kit === 'adventure' || kit === 'nature' ? 'area' : 'exact'].note} <Link to="/studio/tools" className="font-semibold text-sky hover:underline">Choose your tools</Link></p>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">How do you run this live?</legend>
            <HostModePicker value={cfg.hostMode} onChange={(m) => setCfg({ ...cfg, hostMode: m })} />
          </fieldset>
          <button type="submit" disabled={busy} className="mt-1 inline-flex items-center justify-center rounded-pill bg-sun px-6 py-3 font-display text-base font-bold text-ink-950 hover:bg-sun-soft disabled:opacity-60">
            {busy ? 'Starting…' : <>{cfg.hostMode === 'team' ? 'Open the control room in ' : 'Start session in '}{city.name}</>}
          </button>
          {err && (
            <div role="alert" className="flex flex-col gap-2 rounded-xl border border-sun px-3.5 py-3 text-sm" data-testid="golive-error">
              <span>{err}</span>
              <button type="button" onClick={() => { setErr(''); setPhase('live') }} className="self-start rounded-pill border border-line px-3.5 py-1.5 font-semibold hover:border-sky">Start the demo session instead</button>
            </div>
          )}
        </form>

        <div className="flex min-w-0 flex-col gap-4">
          <VideoSlot stream={previewStream(cfg)} label="Camera preview" className="rounded-[20px] ring-1 ring-line" />
          <ul className="grid gap-2 text-sm sm:grid-cols-3">
            {['Location verified', 'Microphone on', 'Connection strong'].map((t) => (
              <li key={t} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                <span className="h-2 w-2 rounded-full" style={{ background: 'var(--ok)' }} />{t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">Recent sessions</h2>
          <Link to="/studio/earnings" className="text-sm text-sky hover:underline">All earnings</Link>
        </div>
        {sessions.length ? (
          <ul className="flex flex-col gap-2.5">
            {sessions.slice(0, 4).map((x) => (
              <li key={x.id} className="flex min-w-0 items-center justify-between gap-4 rounded-card border border-line bg-ink-800 px-4 py-3">
                <span className="min-w-0 truncate">{x.title}</span>
                <span className="shrink-0 text-sm text-fg-muted tabular-nums">{x.peak} peak · {usd(x.coins)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-fg-muted">Your sessions will appear here.</p>}
      </section>
    </div>
  )
}

function previewStream(cfg: Config): Stream {
  const art = (STREAMS.find((s) => s.cityId === cfg.cityId) ?? STREAMS[0]).art
  return { id: 'host-preview', cityId: cfg.cityId, hostId: 'h1', title: cfg.title, place: cfg.place, category: cfg.category, viewers: 0, startedMinAgo: 0, language: 'English', art }
}

function Studio({ cfg, onEnd }: { cfg: Config; onEnd: (s: Summary) => void }) {
  const sim = useLiveSim(cfg.cityId, 'You')
  const [mode] = useMode('web')
  const eng = useToolEngine({ seedKey: cfg.title, category: cfg.category, role: 'host', mode })
  const [hostMode, setHostMode] = useState<HostMode>(cfg.hostMode)
  const [walking, setWalking] = useState(false)
  const [camera, setCamera] = useState(false)
  const [more, setMore] = useState(false)
  const hostVoice = useVoice((v) => v.host)
  useResultVoice(eng, hostVoice)
  const sug = useSuggestion(eng, hostMode === 'auto', walking)
  const [building, setBuilding] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [viewers, setViewers] = useState(14)
  const [peak, setPeak] = useState(14)

  const current = useRef(14)
  useEffect(() => {
    const t = window.setInterval(() => {
      const next = Math.max(8, current.current + Math.floor(Math.random() * 9) - 2)
      current.current = next
      setSeconds((n) => n + 1)
      setViewers(next)
      setPeak((p) => Math.max(p, next))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  const lastChoice = [...sim.msgs].reverse().find((m) => m.kind === 'system' && m.text.startsWith('The room chose'))
  const lead = sim.round.votes[0] >= sim.round.votes[1] ? 0 : 1

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-5">
        <VideoSlot stream={previewStream(cfg)} label={hostMode === 'team' ? (camera ? 'Camera feed: Sam’s phone' : 'No camera yet') : 'Your camera'} className="rounded-[20px] ring-1 ring-line">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <LiveBadge viewers={String(viewers)} />
            <span className="rounded-pill bg-ink-950/75 px-3 py-1 text-xs font-semibold tabular-nums backdrop-blur">{clock(seconds)}</span>
          </div>
          <GiftToast bursts={sim.bursts} />
          <VideoEffects e={eng} />
          <PinLayer e={eng} armed={false} />
          <span className="absolute right-4 top-4 z-10 rounded-pill bg-ink-950/75 px-3 py-1 text-xs font-semibold backdrop-blur">Viewers see this 4 s later</span>
          <VoiceBadge className="absolute bottom-4 left-4 z-10" />
        </VideoSlot>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm text-fg-muted">Mode</span>
          {(['auto', 'manual', 'team'] as const).map((m) => (
            <button key={m} type="button" aria-pressed={hostMode === m} onClick={() => setHostMode(m)} className={`rounded-pill border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${hostMode === m ? 'border-sun bg-sun text-ink-950' : 'border-line hover:border-sky'}`}>{m === 'auto' ? 'Solo, automatic' : m === 'manual' ? 'Solo, manual' : 'Team'}</button>
          ))}
          <VoiceToggle who="host" label="Voice for results" className="ml-auto" />
        </div>

        {hostMode === 'team' && <TeamPanel camera={camera} onCamera={setCamera} />}
        {hostMode === 'auto' && (
          <section className="flex flex-col gap-3 rounded-card border border-line bg-ink-800 p-4" aria-label="One button">
            <OneButton s={sug} e={eng} />
            <div className="flex flex-wrap items-center gap-2.5">
              <WalkingSwitch on={walking} onChange={setWalking} />
              <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} className="rounded-pill border border-line px-3.5 py-1.5 text-[13px] font-semibold hover:border-sky">{more ? 'Hide' : 'More'} tools</button>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{cfg.title}</h1>
            <p className="text-fg-muted">{cfg.place}, {CITIES.find((c) => c.id === cfg.cityId)?.name}</p>
          </div>
          <button
            type="button"
            onClick={() => onEnd({ seconds, peak, gifts: sim.giftCount, coins: sim.giftCoins })}
            className="rounded-pill border border-sun px-5 py-2.5 font-display text-sm font-bold text-sun-soft hover:bg-sun hover:text-ink-950"
          >
            End session
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Watching', String(viewers)],
            ['Stay / Move on', `${Math.round(eng.stay)} / ${100 - Math.round(eng.stay)}`],
            ['Gifts', String(sim.giftCount)],
            ['Earned', usd(sim.giftCoins)],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 rounded-card border border-line bg-ink-800 p-4">
              <dt className="text-sm text-fg-muted">{k}</dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-4 xl:grid-cols-2">
          <ToolCard e={eng} variant="host" />
        </div>
        {(hostMode !== 'auto' || more) && <ToolLauncher e={eng} category={cfg.category} onBuild={() => setBuilding(true)} manageHref="#/studio/tools" />}

        <VoteCard round={sim.round} mode="host" />

        <div className="rounded-card border border-line bg-ink-800 p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold">Route guidance</h2>
          <p className="mt-1 text-fg-muted">
            {sim.round.resolved === null
              ? <>The room is leaning toward <b className="text-fg">{sim.round.options[lead]}</b>.</>
              : <>Head to <b className="text-fg">{sim.round.options[sim.round.resolved]}</b>. A new vote opens in a few seconds.</>}
          </p>
          {lastChoice && <p className="mt-2 text-sm text-fg-muted">Last decision: {lastChoice.text.replace('The room chose ', '').replace(' The host is heading there.', '')}</p>}
        </div>
      </div>

      <ChatPanel
        msgs={sim.msgs}
        selfName="You, host"
        onSend={(t) => sim.send(t, 'You', 'host')}
        placeholder="Reply to the room"
        className="h-[560px] lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:max-h-[780px]"
      />

      {building && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/70 p-4 sm:p-8" role="dialog" aria-label="Tool builder" aria-modal="true">
          <button type="button" aria-label="Close" onClick={() => setBuilding(false)} className="fixed inset-0 cursor-default" />
          <div className="pop-in relative my-auto w-full max-w-[560px] rounded-card border border-line bg-ink-800 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Tool builder</h2><button type="button" onClick={() => setBuilding(false)} className="rounded-pill border border-line px-3 py-1 text-sm hover:border-sky">Close</button></div>
            <ToolBuilder category={cfg.category} onDone={() => setBuilding(false)} onLaunch={eng.launch} />
          </div>
        </div>
      )}
    </div>
  )
}

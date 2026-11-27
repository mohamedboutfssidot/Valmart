import { useEffect, useState } from 'react'
import { Gesture, LiveTheme } from '../../live/theme'
import { Link, useParams } from 'react-router-dom'
import { cityOf, formatCount, hostOf, streamById, type Stream } from '../../data/mock'
import { useExtra } from '../../extra'
import GroupLiveBar from '../../features/GroupLiveBar'
import { ReportButton } from '../../features/kit'
import { NARRATION } from '../../data/live'
import { useLiveSim } from '../../hooks/useLiveSim'
import { useDemo } from '../../store'
import { Avatar, Button, LiveBadge } from '../../components/ui'
import { VideoSlot } from '../../components/VideoSlot'
import { Hints } from '../../live/Hints'
import { LiveStrip, PaceSignal, SteerRing } from '../../live/Steer'
import { ChatPanel } from '../../components/ChatPanel'
import { useToolEngine } from '../../live/useToolEngine'
import { useMode } from '../../live/store'
import { planOf } from '../../data/plans'
import { PaceChips, PinLayer, VideoEffects, GiftToast } from '../../live/ui'
import { Cinema } from '../../live/Cinema'
import { NowTool, Panels } from '../../live/Dock'
import { ClipPicker } from '../../video/ClipPicker'
import { speak, useVoice } from '../../live/tts'
import { CinemaIcon, DotsIcon, MoreMenu, qualityLabel, type Quality } from '../../live/LiveMenu'
import { VmPause } from '../../live/Pause'
import { Airplane, ChatCircleDots, ClosedCaptioning } from '@phosphor-icons/react'

export default function Live() {
  const { id } = useParams()
  const stream = id ? streamById(id) : undefined
  if (!stream) {
    return (
      <div className="rounded-card border border-line bg-ink-800 p-8 text-center">
        <h1 className="text-2xl font-bold">This session has ended</h1>
        <p className="mt-2 text-fg-muted">Pick another live session to keep exploring.</p>
        <div className="mt-5"><Button to="/app">Back to Discover</Button></div>
      </div>
    )
  }
  return <LiveRoom key={stream.id} stream={stream} />
}

function LiveRoom({ stream }: { stream: Stream }) {
  const chatOff = false
  const host = hostOf(stream.hostId)
  const city = cityOf(stream.cityId)
  const sim = useLiveSim(city.id, host.name)
  const { coins, isPremium, plan, spend, visit, logGift } = useDemo()
  const { followHosts, toggleHost } = useExtra()
  const following = followHosts.includes(host.id)
  useEffect(() => { visit(stream.id) }, [visit, stream.id])
  const [mode, setMode] = useMode('web')
  const eng = useToolEngine({ seedKey: stream.id, category: stream.category, role: 'viewer', mode })
  const [lookArmed, setLookArmed] = useState(false)
  const [looks, setLooks] = useState(0)
  const [note, setNote] = useState('')
  const lookMax = planOf(plan).looks
  const toggleLook = () => { if (!lookArmed && looks >= lookMax) { setNote(lookMax === 0 ? 'Look here starts with Plus (5 per live) and is unlimited on Premium.' : `${planOf(plan).name} plan: ${lookMax} Look here per live. Upgrade for more.`); return } setLookArmed((v) => !v) }
  const [cinema, setCinema] = useState(false)
  const [theater, setTheater] = useState(() => { try { return localStorage.getItem('valmart-theater') === '1' } catch { return false } })
  const toggleTheater = () => setTheater((v) => { try { localStorage.setItem('valmart-theater', v ? '0' : '1') } catch { /* private window */ } return !v })
  const [fsMore, setFsMore] = useState(false)
  const [quality, setQuality] = useState<Quality>('Auto')
  const voiceOn = useVoice((s) => s.viewer)
  useEffect(() => {
    if (cinema) return
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (ev.key === 'p' || ev.key === 'P') setLookArmed((v) => !v)
      if (ev.key === 'Escape') setLookArmed(false)
      if (ev.key === 't' || ev.key === 'T') toggleTheater()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cinema])

  const needsTranslation = stream.language !== 'English'
  const [translate, setTranslate] = useState(true)
  const [cap, setCap] = useState(0)
  const [capOn, setCapOn] = useState(() => { try { return localStorage.getItem('valmart-cc') !== 'off' } catch { return true } })
  const [capSize, setCapSize] = useState<'S' | 'M' | 'L'>(() => { try { return (localStorage.getItem('valmart-cc-size') as 'S' | 'M' | 'L') || 'M' } catch { return 'M' } })
  type Blocks = { steer: boolean; captions: boolean; info: boolean; tools: boolean; chat: boolean; chatSize: 'S' | 'M' | 'L' }
  const [blocks, setBlocksRaw] = useState<Blocks>(() => { try { return { steer: true, captions: true, info: true, tools: true, chat: true, chatSize: 'M', ...JSON.parse(localStorage.getItem('valmart-live-layout') || '{}') } } catch { return { steer: true, captions: true, info: true, tools: true, chat: true, chatSize: 'M' } } })
  const setBlocks = (p: Partial<Blocks>) => setBlocksRaw((b) => { const n = { ...b, ...p }; try { localStorage.setItem('valmart-live-layout', JSON.stringify(n)) } catch { /* private window */ } return n })
  const [layoutOpen, setLayoutOpen] = useState(false)
  const setCC = (v: boolean) => { setCapOn(v); try { localStorage.setItem('valmart-cc', v ? 'on' : 'off') } catch { /* private window */ } }
  const setSize = (v: 'S' | 'M' | 'L') => { setCapSize(v); try { localStorage.setItem('valmart-cc-size', v) } catch { /* private window */ } }
  const capText = capSize === 'S' ? 'text-[13px]' : capSize === 'L' ? 'text-[20px]' : 'text-[15px]'
  const lines = NARRATION[city.id]
  useEffect(() => {
    const t = window.setInterval(() => setCap((n) => n + 1), 7000)
    return () => window.clearInterval(t)
  }, [])
  const line = lines[cap % lines.length]
  const captionText = needsTranslation ? (translate ? line.en : line.orig) : line.en
  useEffect(() => {
    if (voiceOn) speak(captionText, needsTranslation && !translate ? 'und' : 'en-US')
  }, [cap, voiceOn]) // eslint-disable-line react-hooks/exhaustive-deps

  const onGift = (g: { id: string; name: string; emoji: string; cost: number }) => {
    if (!spend(g.cost)) return 'Not enough demo coins.'
    sim.sendGift(g, 'You')
    logGift({ streamId: stream.id, name: g.name, emoji: g.emoji, cost: g.cost })
    return `Sent ${g.name} to ${host.name}.`
  }

  const cycleSize = () => setSize(capSize === 'S' ? 'M' : capSize === 'M' ? 'L' : 'S')
  const icon = 'lt-icon'
  const fsBtn = 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/75 text-white backdrop-blur-md hover:border-sky'
  const category = stream.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const m = stream.startedMinAgo
  const menu = (close: () => void, className = '') => <MoreMenu capSize={capSize} setSize={setSize} plan={plan} quality={quality} setQuality={setQuality} onClose={close} className={className} />

  return (
    <LiveTheme stream={stream} plan={plan} className="">
    <div className={`grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] ${theater ? 'is-theater' : ''}`}>
      <div className={`relative flex min-w-0 flex-col gap-3 ${theater ? 'lg:contents' : ''}`}>
        {!theater && <Hints className="left-4 top-16 max-sm:!relative max-sm:!left-auto max-sm:!top-auto max-sm:mx-auto" />}
        <VideoSlot stream={stream} player={!cinema} audio fit={theater ? 'contain' : 'cover'} className={`lt-ambilight !rounded-none ${theater ? 'lg:col-span-2 lg:!aspect-auto lg:h-[min(76vh,calc((min(100vw,1500px)-4rem)*0.5625))]' : ''}`}>
          {blocks.steer && <SteerRing stream={stream} />}
          <LiveStrip stream={stream} className="absolute left-4 top-14 z-10" />
          {capOn && blocks.captions && (
            <div className="pointer-events-none absolute inset-x-3 bottom-14 z-10 flex justify-center sm:bottom-16">
              <p className="max-w-[40ch] rounded-xl bg-ink-950/80 px-4 py-2 text-center backdrop-blur" key={cap}>
                {needsTranslation && translate ? (
                  <>
                    <span className="block text-xs text-fg-muted">{line.orig}</span>
                    <span className={`block font-medium ${capText}`}>{line.en}</span>
                  </>
                ) : (
                  <span className={`block font-medium ${capText}`}>{needsTranslation ? line.orig : line.en}</span>
                )}
              </p>
            </div>
          )}

          <GiftToast bursts={sim.bursts} />
          <VmPause />
          <VideoEffects e={eng} />
          <PinLayer e={eng} armed={lookArmed || eng.pinArmed} onDone={() => { setLookArmed(false); setLooks((n) => n + 1) }} />
        </VideoSlot>

        <div className="relative mx-4 flex flex-wrap items-center gap-2 rounded-card border border-line bg-ink-800 px-3 py-2 sm:mx-5" role="toolbar" aria-label="Live controls" data-testid="caption-bar">
          <PaceChips e={eng} compact iconOnly />
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          <button type="button" onClick={toggleLook} aria-pressed={lookArmed} aria-label="Look here" title="Look here: tap the video to point at something" className={`${icon} ${lookArmed ? 'is-on' : ''}`}><Gesture name="look" size={20} /></button>
          <button type="button" onClick={() => setCC(!capOn)} aria-pressed={capOn} title="Captions" aria-label="Captions" data-testid="cc-toggle" className={`${icon} ${capOn ? 'is-on' : ''}`}><ClosedCaptioning size={20} weight={capOn ? 'fill' : 'regular'} /></button>
          <span className="ml-auto flex items-center gap-2">
            <button type="button" onClick={toggleTheater} aria-pressed={theater} data-testid="theater-btn" aria-label={theater ? 'Default view' : 'Cinema mode'} title={theater ? 'Default view (T)' : 'Cinema mode (T)'} className={`${icon} max-sm:hidden ${theater ? 'is-on' : ''}`}><CinemaIcon filled={theater} /></button>
            <button type="button" onClick={() => setCinema(true)} aria-label="Full screen" title="Full screen" className={`${icon} is-hot`}><Gesture name="cinema" size={20} /></button>
            <button type="button" onClick={() => setLayoutOpen((v) => !v)} aria-pressed={layoutOpen} aria-label="More" title="More" data-testid="layout-btn" className={`${icon} ${layoutOpen ? 'is-on' : ''}`}><DotsIcon /></button>
          </span>
          {note && <p role="status" data-testid="plan-note" className="order-last w-full text-sm text-fg-muted">{note} <Link to="/app/plan" className="font-semibold text-sky-deep underline">See plans</Link></p>}
          {layoutOpen && menu(() => setLayoutOpen(false))}
        </div>

        {blocks.info && (
          <div className="flex flex-col gap-3 border-t border-line px-4 pt-4 sm:px-5" data-testid="channel-row">
            <div className="flex flex-wrap items-start gap-4">
              <Link to={`/app/host/${host.id}`} className="relative shrink-0" aria-label={host.name}>
                <span className="block rounded-full ring-2 ring-[#e91916]"><Avatar name={host.name} size={64} /></span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-[#e91916] px-1.5 py-0.5 text-[10px] font-extrabold uppercase leading-none text-white">Live</span>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="flex items-center gap-2 text-xl font-bold leading-tight">
                  <Link to={`/app/host/${host.id}`} className="hover:underline" data-testid="host-link">{host.name}</Link>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-label="Verified" className="shrink-0 text-sky"><path fill="currentColor" d="M12 2l2.4 2 3.1-.2 1 3 2.7 1.6-.8 3 .8 3-2.7 1.6-1 3-3.1-.2L12 22l-2.4-2-3.1.2-1-3L2.8 15.6 3.6 12.6 2.8 9.6 5.5 8l1-3 3.1.2z" /><path d="M8.5 12.2l2.4 2.4 4.6-4.8" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" /></svg>
                </h1>
                <p className="mt-0.5 truncate text-[15px] font-semibold">{stream.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                  <Link to={`/app/category/${category}`} className="font-semibold text-sky hover:underline">{stream.category}</Link>
                  <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs font-semibold">{stream.language}</span>
                  <span className="text-fg-muted">{stream.place}, <Link to={`/app/city/${city.id}`} className="hover:underline">{city.name}</Link></span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button type="button" onClick={() => toggleHost(host.id)} aria-pressed={following} data-testid="follow-btn" className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition active:scale-95 ${following ? 'bg-ink-700 text-fg hover:bg-line' : 'bg-sky text-ink-950 hover:bg-sky-soft'}`}>{following ? '✓ Following' : '♡ Follow'}</button>
                <p className="flex items-center gap-3 text-sm font-semibold">
                  <span className="tabular-nums text-sky">{formatCount(stream.viewers)} watching</span>
                  <span className="tabular-nums text-fg-muted">{String(Math.floor(m / 60)).padStart(2, '0')}:{String(m % 60).padStart(2, '0')}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-3">
              <Link to={`/app/requests?host=${encodeURIComponent(host.name)}&city=${city.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3.5 py-1.5 text-sm font-semibold hover:border-sky" title="Ask this host for a trip made for you"><Airplane size={16} />Request a trip</Link>
              <ReportButton kind="live" target={stream.title} />
            </div>
          </div>
        )}
        <GroupLiveBar streamId={stream.id} streamTitle={stream.title} />
      </div>

      <aside className={`flex min-h-0 min-w-0 flex-col gap-0 ${theater ? 'lg:col-start-2 lg:row-start-2 lg:row-span-6' : ''} lg:sticky lg:top-[60px] lg:h-[calc(100vh-60px)] lg:border-l lg:border-line lg:bg-ink-900`} aria-label="Live panel">
        <h2 className="shrink-0 border-b border-line py-3 text-center text-[15px] font-bold">Chat</h2>
        {blocks.tools && <div className="shrink-0 p-2.5"><NowTool e={eng} /></div>}
        <PaceSignal stay={eng.stay} className="mx-2.5 mb-2" />
        {blocks.chat ? <ChatPanel msgs={sim.msgs} selfName="You" coins={coins} onGift={onGift} onSend={(x) => sim.send(x, 'You')} locked={eng.chatLock} off={chatOff} className="min-h-0 flex-1 !rounded-none !border-0 !bg-transparent max-lg:h-[460px]" /> : <button type="button" onClick={() => setBlocks({ chat: true })} className="lt-btn justify-center"><ChatCircleDots size={18} />Show the chat</button>}
      </aside>

      {cinema && (
        <Cinema
          stream={stream}
          eng={eng}
          viewers={formatCount(stream.viewers)}
          hostName={host.name}
          onExit={() => setCinema(false)}
          cc={{ on: capOn, toggle: () => setCC(!capOn), size: capSize, cycle: cycleSize }}
          extra={<>
            <button type="button" onClick={() => { setCinema(false); if (!theater) toggleTheater() }} aria-label="Cinema mode" title="Cinema mode" data-testid="fs-cinema" className={fsBtn}><CinemaIcon /></button>
            <button type="button" onClick={() => setFsMore((v) => !v)} aria-pressed={fsMore} aria-label="More" title="More" data-testid="fs-more" className={fsBtn}><DotsIcon /></button>
            {fsMore && menu(() => setFsMore(false))}
          </>}
          bursts={<GiftToast bursts={sim.bursts} />}
          captions={capOn ? (
            <p className="max-w-[56ch] rounded-xl bg-ink-950/75 px-5 py-2.5 text-center backdrop-blur" key={cap}>
              <span className={`block font-medium ${capSize === 'S' ? 'text-[15px]' : capSize === 'L' ? 'text-[22px]' : 'text-[17px]'}`}>{captionText}</span>
            </p>
          ) : null}
          chat={<ChatPanel msgs={sim.msgs} selfName="You" coins={coins} onGift={onGift} onSend={(t) => sim.send(t, 'You')} locked={eng.chatLock} off={chatOff} className="!h-full !rounded-none !border-0 !bg-transparent" />}
        />
      )}
    </div>
    </LiveTheme>
  )
}

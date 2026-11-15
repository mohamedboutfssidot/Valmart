import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LiveRecap } from '../../live/Recap'
import { Gesture, LiveTheme } from '../../live/theme'
import { Link, useParams } from 'react-router-dom'
import { audienceOf, cityOf, formatCount, hostOf, streamById, type Stream } from '../../data/mock'
import { useExtra } from '../../extra'
import { GroupBar } from '../../features/Group'
import { ReportButton } from '../../features/kit'
import { NARRATION } from '../../data/live'
import { useLiveSim } from '../../hooks/useLiveSim'
import { useDemo } from '../../store'
import { Avatar, Button, LiveBadge } from '../../components/ui'
import { VideoSlot } from '../../components/VideoSlot'
import { Hints } from '../../live/Hints'
import { ChatPanel } from '../../components/ChatPanel'
import { useToolEngine } from '../../live/useToolEngine'
import { useMode } from '../../live/store'
import { planOf } from '../../data/plans'
import { PaceChips, PinLayer, VideoEffects, GiftToast } from '../../live/ui'
import { Cinema } from '../../live/Cinema'
import { NowTool, Panels } from '../../live/Dock'
import { ClipPicker } from '../../video/ClipPicker'
import { speak, stopSpeaking, useVoice, VoiceBadge } from '../../live/tts'
import { SignOut, Airplane, ChatCircleDots, ClosedCaptioning, SlidersHorizontal, SpeakerHigh, SpeakerSlash, TextAa } from '@phosphor-icons/react'

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
  const nav = useNavigate()
  const t0 = useRef(Date.now())
  const [giftN, setGiftN] = useState(0)
  const [recap, setRecap] = useState(false)
  const { coins, isPremium, plan, spend, visit, addMoment, logGift, moments } = useDemo()
  useEffect(() => { visit(stream.id) }, [visit, stream.id])
  const saved = moments.filter((m) => m.streamId === stream.id).length
  const [mode, setMode] = useMode('web')
  const eng = useToolEngine({ seedKey: stream.id, category: stream.category, role: 'viewer', mode, onSave: () => saveMoment() })
  const [lookArmed, setLookArmed] = useState(false)
  const [looks, setLooks] = useState(0)
  const [note, setNote] = useState('')
  const lookMax = planOf(plan).looks
  const saveMoment = () => { const ok = addMoment(stream.id); setNote(ok ? 'Saved to your trips.' : `Your ${planOf(plan).name} plan keeps ${planOf(plan).saved} moments. Delete one or upgrade.`) }
  const toggleLook = () => { if (!lookArmed && looks >= lookMax) { setNote(lookMax === 0 ? 'Look here starts with Plus (5 per live) and is unlimited on Premium.' : `${planOf(plan).name} plan: ${lookMax} Look here per live. Upgrade for more.`); return } setLookArmed((v) => !v) }
  const [cinema, setCinema] = useState(false)
  const voiceOn = useVoice((s) => s.viewer)
  useEffect(() => {
    if (cinema) return
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (ev.key === 'p' || ev.key === 'P') setLookArmed((v) => !v)
      if (ev.key === 'Escape') setLookArmed(false)
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
  const setVoice = useVoice((x) => x.setViewer)
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
    setGiftN((n) => n + 1)
    return `Sent ${g.name} to ${host.name}.`
  }

  return (
    <LiveTheme stream={stream} plan={plan} className="-mx-4 px-4 pt-1 sm:-mx-6 sm:px-6">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_460px] 2xl:gap-8">
      <div className="relative flex min-w-0 flex-col gap-5">
        <Hints className="left-4 top-16 max-sm:!relative max-sm:!left-auto max-sm:!top-auto max-sm:mx-auto" />
        <VideoSlot stream={stream} player={!cinema} audio className="lt-ambilight rounded-[20px] ring-1 ring-line">
          <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
            <LiveBadge viewers={formatCount(stream.viewers)} />
            <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold backdrop-blur ${isPremium ? 'bg-sky text-ink-950' : 'bg-ink-950/75 text-fg-muted'}`}>{planOf(plan).quality}</span>
            {needsTranslation ? (
              <button
                type="button"
                aria-pressed={translate}
                onClick={() => setTranslate((v) => !v)}
                className={`rounded-pill px-3 py-1 text-xs font-semibold backdrop-blur ${translate ? 'bg-sky text-ink-950' : 'bg-ink-950/75 text-fg'}`}
              >
                Translation to English: {translate ? 'on' : 'off'}
              </button>
            ) : (
              <span className="rounded-pill bg-ink-950/75 px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur">English audio</span>
            )}
          </div>

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

          <VideoEffects e={eng} />
          <PinLayer e={eng} armed={lookArmed || eng.pinArmed} onDone={() => { setLookArmed(false); setLooks((n) => n + 1) }} />
        </VideoSlot>
        {blocks.steer && <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center" role="group" aria-label="Steer the walk">
          <PaceChips e={eng} />
          <button type="button" onClick={toggleLook} aria-pressed={lookArmed} title="Tap the video to point at something. The host sees your mark for 2 seconds." className="lt-btn"><Gesture name="look" />Look here</button>
          <button type="button" onClick={() => setRecap(true)} title="Leave this live" data-testid="leave-live" className="lt-btn"><SignOut size={18} />Leave</button>
          <button type="button" onClick={saveMoment} title="Keep this moment in My trips" className="lt-btn"><Gesture name="save" />{saved ? `Saved (${saved})` : <span>Save<span className="hidden 2xl:inline"> moment</span></span>}</button>
          {note && <p role="status" data-testid="plan-note" className="w-full text-sm text-fg-muted">{note} <Link to="/app/plan" className="font-semibold text-sky-deep underline">See plans</Link></p>}
          <button type="button" onClick={() => setCinema(true)} title="Full screen video, with chat and tools on top" className="lt-btn is-hot max-sm:col-span-2 sm:ml-auto"><Gesture name="cinema" /><span>Full screen</span></button>
        </div>}

        <div className="relative flex flex-wrap items-center gap-2" role="toolbar" aria-label="Captions and layout" data-testid="caption-bar">
          <button type="button" onClick={() => setCC(!capOn)} aria-pressed={capOn} title="Captions on or off" aria-label="Captions" data-testid="cc-toggle" className={`lt-icon ${capOn ? 'is-on' : ''}`}><ClosedCaptioning size={20} weight={capOn ? 'fill' : 'regular'} /></button>
          <button type="button" onClick={() => setSize(capSize === 'S' ? 'M' : capSize === 'M' ? 'L' : 'S')} disabled={!capOn} title={`Caption size: ${capSize}`} aria-label="Caption size" data-testid="cc-size" className="lt-icon disabled:opacity-40"><TextAa size={20} /><b className="ml-0.5 text-[11px]">{capSize}</b></button>
          <button type="button" onClick={() => { setVoice(!voiceOn); if (voiceOn) stopSpeaking(); else speak('Voice on. I will read the captions.') }} aria-pressed={voiceOn} title="Read captions aloud" aria-label="Read captions aloud" className={`lt-icon ${voiceOn ? 'is-on' : ''}`}>{voiceOn ? <SpeakerHigh size={20} weight="fill" /> : <SpeakerSlash size={20} />}</button>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          <button type="button" onClick={() => setLayoutOpen((v) => !v)} aria-pressed={layoutOpen} title="Choose which blocks to show" data-testid="layout-btn" className={`lt-icon !w-auto gap-1.5 px-3 ${layoutOpen ? 'is-on' : ''}`}><SlidersHorizontal size={20} /><span className="text-sm font-semibold">Layout</span></button>
          {layoutOpen && (
            <div className="pop-in absolute left-0 top-full z-30 mt-2 flex w-[260px] flex-col gap-1 rounded-card border border-line bg-ink-900 p-3 shadow-xl" role="group" aria-label="Blocks" data-testid="layout-menu">
              {([['steer', 'Steer buttons'], ['captions', 'Caption bar'], ['info', 'Host and place'], ['tools', 'Live tools'], ['chat', 'Chat']] as const).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-800"><span>{label}</span><input type="checkbox" checked={blocks[k]} onChange={(e) => setBlocks({ [k]: e.target.checked } as Partial<Blocks>)} className="h-4 w-4 accent-[rgb(var(--sky-rgb))]" data-testid={`blk-${k}`} /></label>
              ))}
              <div className="mt-1 flex items-center justify-between gap-2 px-2 text-sm"><span>Chat height</span><span className="flex gap-1">{(['S', 'M', 'L'] as const).map((z) => <button key={z} type="button" aria-pressed={blocks.chatSize === z} onClick={() => setBlocks({ chatSize: z })} className={`h-7 w-8 rounded-full text-xs font-bold ${blocks.chatSize === z ? 'bg-ink-700 text-fg' : 'text-fg-muted'}`}>{z}</button>)}</span></div>
              <button type="button" onClick={() => setBlocks({ steer: true, captions: true, info: true, tools: true, chat: true, chatSize: 'M' })} className="mt-1 rounded-lg px-2 py-1.5 text-left text-sm text-sky-deep hover:bg-ink-800">Reset</button>
            </div>
          )}
        </div>

        {blocks.info && <div className="flex flex-wrap items-start gap-4 border-t border-line pt-4">
          <Avatar name={host.name} size={44} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold leading-snug sm:text-2xl">{stream.title}</h1>
            <p className="mt-0.5 text-fg-muted"><Link to={`/app/host/${host.id}`} className="font-semibold text-fg hover:underline" data-testid="host-link">{host.name}</Link>, {stream.place}, <Link to={`/app/city/${city.id}`} className="hover:underline">{city.name}</Link>. {stream.category}, {stream.language}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/app/requests?host=${encodeURIComponent(host.name)}&city=${city.id}`} className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3.5 py-1.5 text-sm font-semibold hover:border-sky-deep" title="Ask this host for a walk made for you"><Airplane size={16} />Request a trip</Link>
            <ReportButton kind="live" target={stream.title} />
          </div>
        </div>}
        <GroupBar />
      </div>

      <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1" aria-label="Live panel">
        {blocks.tools && <NowTool e={eng} />}
        {blocks.chat ? <ChatPanel msgs={sim.msgs} selfName="You" coins={coins} onGift={onGift} onSend={(x) => sim.send(x, 'You')} locked={eng.chatLock} off={chatOff} className={`shrink-0 ${blocks.chatSize === 'S' ? 'h-[320px] lg:h-[clamp(300px,calc(100vh-30rem),380px)]' : blocks.chatSize === 'L' ? 'h-[560px] lg:h-[clamp(520px,calc(100vh-14rem),760px)]' : 'h-[460px] lg:h-[clamp(420px,calc(100vh-24rem),680px)]'}`} /> : <button type="button" onClick={() => setBlocks({ chat: true })} className="lt-btn justify-center"><ChatCircleDots size={18} />Show the chat</button>}
      </aside>

      {cinema && (
        <Cinema
          stream={stream}
          eng={eng}
          viewers={formatCount(stream.viewers)}
          hostName={host.name}
          onExit={() => setCinema(false)}
          cc={{ on: capOn, toggle: () => setCC(!capOn), size: capSize, cycle: () => setSize(capSize === 'S' ? 'M' : capSize === 'M' ? 'L' : 'S') }}
          bursts={<GiftToast bursts={sim.bursts} />}
          captions={capOn ? (
            <p className="max-w-[56ch] rounded-xl bg-ink-950/75 px-5 py-2.5 text-center backdrop-blur" key={cap}>
              <span className={`block font-medium ${capSize === 'S' ? 'text-[15px]' : capSize === 'L' ? 'text-[22px]' : 'text-[17px]'}`}>{captionText}</span>
            </p>
          ) : null}
          chat={<ChatPanel msgs={sim.msgs} selfName="You" coins={coins} onGift={onGift} onSend={(t) => sim.send(t, 'You')} locked={eng.chatLock} off={chatOff} className="!h-full !rounded-none !border-0 !bg-transparent" />}
        />
      )}
      {recap && <LiveRecap title={stream.title} host={host.name} minutes={Math.round((Date.now() - t0.current) / 60000)} gifts={giftN} moments={saved} onStay={() => setRecap(false)} onLeave={() => nav('/app')} />}
    </div>
    </LiveTheme>
  )
}
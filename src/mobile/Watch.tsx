// Watching a live on a phone: a normal watch page (video on top, details and tools below), not a swipe feed.
import { Gesture, LiveTheme } from '../live/theme'
import { planOf } from '../data/plans'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cityOf, formatCount, hostOf, type Stream } from '../data/mock'
import { NARRATION } from '../data/live'
import { useLiveSim } from '../hooks/useLiveSim'
import { useDemo } from '../store'
import { useExtra } from '../extra'
import { Avatar, LiveBadge } from '../components/ui'
import { VideoSlot } from '../components/VideoSlot'
import { Hints } from '../live/Hints'
import { ChatPanel } from '../components/ChatPanel'
import { Icon } from './icons'
import { usePrefs, type Prefs } from './prefs'
import { ClosedCaptioning, PaperPlaneTilt, SpeakerHigh, Translate } from '@phosphor-icons/react'
import { PaceChips } from '../live/ui'
import { VolumeControl } from '../video/sound'
import { useToolEngine } from '../live/useToolEngine'
import { useMode } from '../live/store'
import { PinLayer, VideoEffects, GiftToast } from '../live/ui'
import { NowTool } from '../live/Dock'
import { Landscape } from './Landscape'
import { Sheet } from './Sheet'
import { LiveStrip, SteerRing } from '../live/Steer'
import { VmPause } from '../live/Pause'
import { Cinema } from '../live/Cinema'
import { speak } from '../live/tts'
import { ReportButton } from '../features/kit'
import { useRoom } from '../rooms/useRoom'
import { getName } from '../rooms/api'
import { useThumb } from '../rooms/thumb'


/** Captions button with its small menu: on/off, translate, read aloud, size. Opens upward in Cinema. */
function CaptionMenu({ needs, up = false, onVideo = true }: { needs: boolean; up?: boolean; onVideo?: boolean }) {
  const pf = usePrefs((s) => s.p)
  const setPf = usePrefs((s) => s.set)
  const [open, setOpen] = useState(false)
  const chip = (on: boolean) => `rounded-pill px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 ${on ? 'bg-sky text-ink-950' : 'bg-ink-700 text-fg'}`
  return (
    <span className={`relative ${up ? 'block min-w-0' : ''}`}>
      <button type="button" aria-pressed={pf.captions} aria-label="Captions and translation" title="Captions and translation" data-testid="m-cc" onClick={() => setOpen((v) => !v)} className={`flex items-center backdrop-blur ${up ? 'h-10 w-10 justify-center gap-0 rounded-full border text-[9px] leading-none' : 'h-9 gap-1 rounded-pill px-2.5 text-xs'} font-bold ${pf.captions ? (up ? 'border-sky bg-sky text-ink-950' : 'bg-sky text-ink-950') : 'border border-white/30 bg-black/75 text-white'}`}><ClosedCaptioning size={up ? 18 : 20} weight="fill" />{up ? null : needs && pf.translate && <span>EN</span>}</button>
      {open && (
        <div className={`pop-in absolute z-30 flex w-[230px] flex-col gap-2 rounded-2xl border border-line bg-ink-900/95 p-3 text-fg backdrop-blur ${up ? 'bottom-full right-0 mb-2' : 'left-0 top-full mt-2'}`} role="menu" aria-label="Captions">
          <button type="button" aria-pressed={pf.captions} onClick={() => setPf('captions', !pf.captions)} className={chip(pf.captions)} data-testid="m-cc-toggle"><ClosedCaptioning size={16} className="mr-1 inline" />Captions {pf.captions ? 'on' : 'off'}</button>
          {needs && <button type="button" aria-pressed={pf.translate} onClick={() => setPf('translate', !pf.translate)} className={chip(pf.translate)} data-testid="m-tr-toggle"><Translate size={16} className="mr-1 inline" />Translate to English: {pf.translate ? 'on' : 'off'}</button>}
          <div className="flex items-center justify-between gap-1"><span className="text-xs text-fg-muted">Size</span>{(['S', 'M', 'L'] as const).map((z) => <button key={z} type="button" aria-pressed={pf.captionSize === z} onClick={() => setPf('captionSize', z)} className={`h-8 w-10 rounded-full text-xs font-bold ${pf.captionSize === z ? 'bg-ink-600 text-fg' : 'bg-ink-700 text-fg-muted'}`}>{z}</button>)}</div>
        </div>
      )}
    </span>
  )
}

const QUALITY: [Prefs['quality'], number][] = [['Auto', 0], ['360p', 360], ['480p', 480], ['720p', 720], ['1080p', 1080], ['1440p', 1440], ['4K', 2160]]

function Row2({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="flex items-center gap-3 rounded-2xl bg-ink-800 px-4 py-3 text-left active:scale-[.98]">
      <span className="text-sky">{icon}</span><span className="flex-1 font-semibold">{label}</span>
      <span className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors duration-300 ${on ? 'bg-sky' : 'bg-ink-700'}`}><span className="absolute left-[3px] top-[3px] h-6 w-6 rounded-full bg-white shadow transition-transform duration-300" style={{ transform: on ? 'translateX(22px)' : 'none' }} /></span>
    </button>
  )
}

export function Watch({ stream, room, onClose, onTrial, onSwitch, onRequest }: { stream: Stream; /** a real live room: the video, chat and tools come from the room */ room?: string; onClose: () => void; onTrial: () => void; onSwitch?: (id: string) => void; onRequest?: () => void }) {
  const m = stream.startedMinAgo
  const hostSim = hostOf(stream.hostId)
  const city = cityOf(stream.cityId)
  const r = useRoom({ room: room ?? '', role: 'viewer', name: getName() })
  const still = useThumb(room ?? '')
  const joined = useRef(false)
  useEffect(() => { if (room && !joined.current) { joined.current = true; void r.join() } }, [room, r])
  const host = room && r.info.meta?.host ? { ...hostSim, name: r.info.meta.host } : hostSim
  const sim = useLiveSim(city.id, host.name)
  const msgs = room ? r.chat : sim.msgs
  const sendMsg = (x: string) => (room ? r.sendChat(x) : sim.send(x, 'You'))
  const watching = room ? String(Math.max(r.info.viewers, 1)) : formatCount(stream.viewers)
  const { coins, isPremium, plan, spend, visit, addMoment, logGift, moments } = useDemo()
  const { followHosts, toggleHost } = useExtra()
  const [mode, setMode] = useMode('mobile')
  const [toast, setToast] = useState<string | null>(null)
  const eng = useToolEngine({ seedKey: stream.id, category: stream.category, role: 'viewer', mode, net: room ? r.net : undefined, simAudience: !room })
  const [look, setLook] = useState(false)
  const [looks, setLooks] = useState(0)
  const toggleLook = () => { if (!look && looks >= planOf(plan).looks) return setToast(planOf(plan).looks === 0 ? 'Look here starts with Plus (5 per live).' : `${planOf(plan).name}: ${planOf(plan).looks} Look here per live. Upgrade for more.`); setLook((v) => !v) }
  const [cinema, setCinema] = useState(false)
  const pf = usePrefs((s) => s.p)
  const setPf = usePrefs((s) => s.set)
  const translate = pf.translate
  const pip = () => { const v = document.querySelector('video'); if (v && document.pictureInPictureEnabled) { if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => undefined); else v.requestPictureInPicture().then(() => setMore(false)).catch(() => setPipNote('Picture in picture is blocked by your browser.')) } else setPipNote('Picture in picture needs a real video stream. Not available in this demo scene.') }
  const [cap, setCap] = useState(0)
  const needs = stream.language !== 'English'
  const line = NARRATION[city.id][cap % NARRATION[city.id].length]
  const saved = moments.filter((m) => m.streamId === stream.id).length
  const following = followHosts.includes(host.id)
  const chatOff = false

  useEffect(() => { visit(stream.id) }, [visit, stream.id])
  const t0 = useRef(Date.now())
  const [giftN, setGiftN] = useState(0)
  const [more, setMore] = useState(false)
  const [pipNote, setPipNote] = useState<string | null>(null)
  useEffect(() => { const t = window.setInterval(() => setCap((n) => n + 1), 7000); return () => window.clearInterval(t) }, [])
  useEffect(() => { if (pf.voiceCaptions) speak(needs && translate ? line.en : needs ? line.orig : line.en, needs && !translate ? 'und' : 'en-US') }, [cap, pf.voiceCaptions]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 1800); return () => window.clearTimeout(t) }, [toast])

  const onGift = (g: { id: string; name: string; emoji: string; cost: number }) => {
    if (!spend(g.cost)) return 'Not enough demo coins.'
    sim.sendGift(g, 'You')
    logGift({ streamId: stream.id, name: g.name, emoji: g.emoji, cost: g.cost })
    setGiftN((n) => n + 1)
    return `Sent ${g.name} to ${host.name}.`
  }
  const stayPct = Math.round(eng.stay)
  const goCinema = () => {
    setCinema(true)
    try {
      const el = document.documentElement
      const lock = () => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape').catch(() => undefined)
      if (el.requestFullscreen) el.requestFullscreen().then(lock).catch(() => undefined); else lock()
    } catch { /* not supported */ }
  }
  const leaveCinema = () => {
    setCinema(false)
    try { screen.orientation.unlock(); if (document.fullscreenElement) void document.exitFullscreen() } catch { /* not supported */ }
  }
  const chip = (on: boolean) => `shrink-0 rounded-pill px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 ${on ? 'bg-sky text-ink-950' : 'bg-ink-700 text-fg'}`

  const moreSheet = more && (
        <Sheet onClose={() => setMore(false)} title="More">
          <div className="flex flex-col gap-2 px-5 pb-6">
            <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">Captions</p>
            <Row2 on={pf.captions} onClick={() => setPf('captions', !pf.captions)} icon={<ClosedCaptioning size={22} />} label="Captions" />
            {needs && <Row2 on={pf.translate} onClick={() => setPf('translate', !pf.translate)} icon={<Translate size={22} />} label="Translate to English" />}
            <div className="flex items-center justify-between rounded-2xl bg-ink-800 px-4 py-3"><span className="font-semibold">Caption size</span>
              <span className="flex gap-1.5">{(['S', 'M', 'L'] as const).map((z) => <button key={z} type="button" aria-pressed={pf.captionSize === z} onClick={() => setPf('captionSize', z)} className={`h-9 w-11 rounded-full text-sm font-bold ${pf.captionSize === z ? 'bg-sky text-ink-950' : 'bg-ink-700 text-fg-muted'}`}>{z}</button>)}</span></div>
            <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">Video</p>
            <div className="flex items-center justify-between rounded-2xl bg-ink-800 px-4 py-3"><span className="font-semibold">Quality</span>
              <span className="vm-qrow">{QUALITY.map(([q, v]) => { const lock = v > ({ free: 720, plus: 1080, premium: 2160 }[plan as 'free'] || 720); return <button key={q} type="button" aria-pressed={pf.quality === q} disabled={lock} title={lock ? `${q} needs ${v > 1080 ? 'Premium' : 'Plus'}` : `Video quality ${q}`} onClick={() => setPf('quality', q)} className={`vm-q ${pf.quality === q ? 'is-on' : ''}`}>{q}</button> })}</span></div>
            <button type="button" data-testid="m-pip" onClick={pip} className="flex items-center gap-3 rounded-2xl bg-ink-800 px-4 py-3.5 text-left font-semibold active:scale-[.98]">Picture in picture<span className="ml-auto text-xs font-normal text-fg-muted">Open</span></button>
            {pipNote && <p className="px-1 text-xs text-fg-muted" data-testid="m-pip-note">{pipNote}</p>}
            <button type="button" data-testid="m-back" onClick={() => { setMore(false); onClose() }} className="mt-2 rounded-2xl border border-line px-4 py-3 text-center text-sm font-semibold text-fg-muted active:scale-[.98]">Back to Explore</button>
          </div>
        </Sheet>
  )

  return (
    <LiveTheme stream={stream} plan={plan} inner="h-full" className="!absolute inset-0 z-30 overflow-hidden bg-ink-900"><div className="slide-in absolute inset-0 flex flex-col bg-ink-900/0 text-fg" data-testid="watch">
      <div className="relative shrink-0">
        <VideoSlot stream={stream} mediaStream={room ? r.info.remote : undefined} still={room ? still : null} sound={!!room} player audio soundButton={false} showLabel={false} className="!aspect-video !rounded-none">
          {room && !r.info.remote && <p className="absolute inset-0 z-[4] grid place-items-center px-6 text-center text-sm font-semibold text-white" data-testid="room-wait">{r.phase === 'error' ? r.error : r.phase === 'in' ? (r.info.publisherHere ? 'Starting the video…' : 'Waiting for the host…') : 'Joining the live…'}</p>}
          {pf.captions && (
            <p key={cap} className={`fade-in pointer-events-none absolute inset-x-3 bottom-3 mx-auto w-fit max-w-full rounded-lg bg-ink-950/75 px-3 py-1.5 text-center font-medium backdrop-blur ${pf.captionSize === 'S' ? 'text-[12px]' : pf.captionSize === 'L' ? 'text-[17px]' : 'text-[14px]'}`}>{needs && !translate ? line.orig : line.en}</p>
          )}
          <button type="button" aria-label="Leave the live" title="Leave the live" data-testid="m-leave" onClick={() => { r.leave(); onClose() }} className="absolute right-3 top-3 z-[12] grid h-9 w-9 place-items-center rounded-full bg-ink-950/75 text-fg backdrop-blur active:scale-90"><Icon name="close" size={18} /></button>
          <GiftToast bursts={sim.bursts} />
          <VmPause />
          <VideoEffects e={eng} />
          <PinLayer e={eng} armed={look || eng.pinArmed} onDone={() => { setLook(false); setLooks((n) => n + 1) }} />
          <SteerRing stream={stream} />
          <LiveStrip stream={stream} className="absolute left-3 top-12 z-[8]" />
        </VideoSlot>
      </div>

      <Hints className="left-1/2 top-14 -translate-x-1/2" />
      <NowTool e={eng} compact className="mx-3 mt-2 !gap-2 !p-3" />

      <div className="vm-bar relative mx-2.5 mt-2 flex shrink-0 items-center gap-1.5 rounded-card border border-line bg-ink-800 px-2 py-1.5" role="toolbar" aria-label="Live controls" data-testid="caption-bar">
        <PaceChips e={eng} compact iconOnly />
        <span className="mx-0.5 h-5 w-px bg-line" aria-hidden="true" />
        <button type="button" onClick={toggleLook} aria-pressed={look} aria-label="Look here" title="Look here: tap the video to point at something" className={`lt-icon ${look ? 'is-on' : ''}`}><Gesture name="look" size={18} /></button>
        <button type="button" onClick={() => setPf('captions', !pf.captions)} aria-pressed={pf.captions} title="Captions" aria-label="Captions" data-testid="cc-toggle" className={`lt-icon ${pf.captions ? 'is-on' : ''}`}><ClosedCaptioning size={18} weight={pf.captions ? 'fill' : 'regular'} /></button>
        <VolumeControl slider="none" />
        <span className="ml-auto flex items-center gap-1.5">
          <button type="button" className="lt-icon is-hot" aria-label="Full screen" title="Full screen" onClick={goCinema} data-testid="m-cinema"><Gesture name="cinema" size={18} /></button>
          <button type="button" className="lt-icon" onClick={() => setMore(true)} title="More" aria-label="More options" data-testid="m-more"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg></button>
        </span>
      </div>

      <div className="mt-2 flex shrink-0 flex-col gap-2.5 border-t border-line px-3 pb-2.5 pt-3" data-testid="channel-row">
        <div>
          <h1 className="line-clamp-2 text-[15px] font-bold leading-snug">{stream.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-fg-muted">
            <span className="inline-flex items-center gap-1.5 font-semibold text-sky"><i className="live-dot" style={{ width: 6, height: 6 }} />{watching} watching</span>
            <span aria-hidden="true">·</span><span className="tabular-nums">{String(Math.floor(m / 60)).padStart(2, '0')}:{String(m % 60).padStart(2, '0')}</span>
            <span aria-hidden="true">·</span><span className="font-semibold text-sky">{stream.category}</span>
            <span className="rounded-full bg-ink-700 px-2 py-0.5 text-[10.5px] font-semibold text-fg">{stream.language}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="relative shrink-0"><span className="block rounded-full ring-2 ring-[#e91916]"><Avatar name={host.name} size={36} /></span><span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-[#e91916] px-1 py-px text-[7px] font-extrabold uppercase leading-none text-white">Live</span></span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[13.5px] font-bold leading-tight"><span className="truncate">{host.name}</span><svg width="13" height="13" viewBox="0 0 24 24" aria-label="Verified" className="shrink-0 text-sky"><path fill="currentColor" d="M12 2l2.4 2 3.1-.2 1 3 2.7 1.6-.8 3 .8 3-2.7 1.6-1 3-3.1-.2L12 22l-2.4-2-3.1.2-1-3L2.8 15.6 3.6 12.6 2.8 9.6 5.5 8l1-3 3.1.2z" /><path d="M8.5 12.2l2.4 2.4 4.6-4.8" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" /></svg></p>
            <p className="truncate text-[12px] text-fg-muted">{room ? ([r.info.meta?.city, r.info.meta?.country].filter(Boolean).join(', ') || stream.place) : `${stream.place}, ${city.name}`}</p>
          </div>
          <button type="button" aria-pressed={following} onClick={() => toggleHost(host.id)} className={`inline-flex h-8 shrink-0 items-center rounded-pill px-4 text-[13px] font-bold active:scale-95 ${following ? 'bg-ink-700 text-fg' : 'bg-fg text-ink-900'}`} data-testid="watch-follow">{following ? 'Following' : 'Follow'}</button>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onRequest} data-testid="m-request" className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-line px-3.5 text-[12.5px] font-semibold active:scale-95"><PaperPlaneTilt size={15} />Request a trip</button>
          <ReportButton kind="live" target={stream.title} className="!text-[12.5px]" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ChatPanel msgs={msgs} selfName="You" coins={coins} onGift={onGift} onSend={sendMsg} locked={eng.chatLock} off={chatOff} className="min-h-0 flex-1 !rounded-none !border-0 !bg-transparent" />
      </div>
      {cinema && (
        <Landscape><Cinema
          mediaStream={room ? r.info.remote : undefined} contained compact overlay={moreSheet} onMore={() => setMore(true)} extra={<CaptionMenu needs={needs} up />} stream={stream} eng={eng} viewers={watching} hostName={host.name} onExit={leaveCinema}
          bursts={<GiftToast bursts={sim.bursts} />}
          captions={pf.captions ? <p key={cap} className={`fade-in max-w-[90%] rounded-lg bg-ink-950/75 px-3 py-1.5 text-center font-medium backdrop-blur ${pf.captionSize === 'S' ? 'text-[12px]' : pf.captionSize === 'L' ? 'text-[17px]' : 'text-[14px]'}`}>{needs && !translate ? line.orig : line.en}</p> : null}
          chat={<ChatPanel msgs={msgs} selfName="You" coins={coins} onGift={onGift} onSend={sendMsg} locked={eng.chatLock} off={chatOff} className="!h-full !rounded-none !border-0" />}
        /></Landscape>
      )}
      {!cinema && moreSheet}
      {toast && <div className="pop-in absolute left-1/2 top-24 z-40 -translate-x-1/2 rounded-pill bg-ink-950/90 px-4 py-2 text-sm font-semibold text-fg backdrop-blur">{toast}</div>}
    </div>
    </LiveTheme>
  )
}
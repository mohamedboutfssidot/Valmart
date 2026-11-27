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
import { ClosedCaptioning, SpeakerHigh, Translate } from '@phosphor-icons/react'
import { useToolEngine } from '../live/useToolEngine'
import { useMode } from '../live/store'
import { PinLayer, VideoEffects, GiftToast } from '../live/ui'
import { NowTool } from '../live/Dock'
import { PaceSignal } from '../live/Steer'
import { Landscape } from './Landscape'
import { Sheet } from './Sheet'
import { LiveStrip, SteerRing } from '../live/Steer'
import { VmPause } from '../live/Pause'
import { Cinema } from '../live/Cinema'
import { speak } from '../live/tts'
import { ReportButton } from '../features/kit'


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
          <button type="button" aria-pressed={pf.voiceCaptions} onClick={() => setPf('voiceCaptions', !pf.voiceCaptions)} className={chip(pf.voiceCaptions)}><SpeakerHigh size={16} className="mr-1 inline" />Read aloud: {pf.voiceCaptions ? 'on' : 'off'}</button>
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

export function Watch({ stream, onClose, onTrial, onSwitch }: { stream: Stream; onClose: () => void; onTrial: () => void; onSwitch?: (id: string) => void }) {
  const host = hostOf(stream.hostId)
  const city = cityOf(stream.cityId)
  const sim = useLiveSim(city.id, host.name)
  const { coins, isPremium, plan, spend, visit, addMoment, logGift, moments } = useDemo()
  const { followHosts, toggleHost } = useExtra()
  const [mode, setMode] = useMode('mobile')
  const [toast, setToast] = useState<string | null>(null)
  const eng = useToolEngine({ seedKey: stream.id, category: stream.category, role: 'viewer', mode })
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
  const chip = (on: boolean) => `shrink-0 rounded-pill px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 ${on ? 'bg-sky text-ink-950' : 'bg-ink-700 text-fg'}`

  return (
    <LiveTheme stream={stream} plan={plan} inner="h-full" className="!absolute inset-0 z-30 overflow-hidden bg-ink-900"><div className="slide-in absolute inset-0 flex flex-col bg-ink-900/0 text-fg" data-testid="watch">
      <div className="relative shrink-0">
        <VideoSlot stream={stream} player audio soundButton={false} showLabel={false} className="!aspect-video !rounded-none">
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2"><LiveBadge viewers={formatCount(stream.viewers)} />
            <CaptionMenu needs={needs} />
            <button type="button" onClick={() => !isPremium && onTrial()} className="rounded-pill bg-ink-950/75 px-2.5 py-1 text-xs font-semibold backdrop-blur">{planOf(plan).quality}</button></div>
          {pf.captions && (
            <p key={cap} className={`fade-in pointer-events-none absolute inset-x-3 bottom-3 mx-auto w-fit max-w-full rounded-lg bg-ink-950/75 px-3 py-1.5 text-center font-medium backdrop-blur ${pf.captionSize === 'S' ? 'text-[12px]' : pf.captionSize === 'L' ? 'text-[17px]' : 'text-[14px]'}`}>{needs && !translate ? line.orig : line.en}</p>
          )}
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

      <div className="flex shrink-0 items-center gap-3 px-4 pt-2.5">
        <Avatar name={host.name} size={34} />
        <div className="min-w-0 flex-1"><h1 className="truncate text-[15px] font-semibold leading-tight">{stream.title}</h1><p className="truncate text-xs text-fg-muted">{host.name}, {city.name}, {formatCount(stream.viewers)} watching</p></div>
        <button type="button" aria-pressed={following} onClick={() => toggleHost(host.id)} className={`rounded-pill px-3.5 py-1.5 text-[13px] font-bold active:scale-95 ${following ? 'bg-ink-700 text-fg' : 'bg-fg text-ink-900'}`} data-testid="watch-follow">{following ? 'Following' : 'Follow'}</button>
      </div>
      <PaceSignal stay={eng.stay} className="mx-3 mb-1 !py-2" />
      <div className="grid shrink-0 grid-cols-5 gap-1 px-2.5 py-2.5" aria-label="Steer the live" role="group">
        <button type="button" className="lt-btn lt-stack" aria-label="Stay here" title="Stay here: vote to stay a little longer" aria-pressed={eng.mineStay === 'stay'} onClick={() => eng.setPace('stay')}><span className="lt-fill !inset-x-0 !top-auto !h-1 rounded-b" style={{ width: `${stayPct}%` }} /><Gesture name="stay" size={20} /><b className="text-[11px]">{stayPct}%</b></button>
        <button type="button" className="lt-btn lt-stack" aria-label="Move on" title="Move on: vote to go to the next spot" aria-pressed={eng.mineStay === 'move'} onClick={() => eng.setPace('move')}><span className="lt-fill !inset-x-0 !top-auto !h-1 rounded-b" style={{ width: `${100 - stayPct}%` }} /><Gesture name="move" size={20} /><b className="text-[11px]">{100 - stayPct}%</b></button>
        <button type="button" className="lt-btn lt-stack" aria-label="Look here" title="Look here: tap the video to point at something" aria-pressed={look} onClick={toggleLook}><Gesture name="look" size={22} /></button>
        <button type="button" className="lt-btn lt-stack" onClick={() => setMore(true)} title="More" aria-label="More options" data-testid="m-more"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg></button>
        <button type="button" className="lt-btn lt-stack is-hot" aria-label="Full screen" title="Full screen" onClick={() => setCinema(true)} data-testid="m-cinema"><Gesture name="cinema" size={22} /></button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ChatPanel msgs={sim.msgs} selfName="You" coins={coins} onGift={onGift} onSend={(x) => sim.send(x, 'You')} locked={eng.chatLock} off={chatOff} className="min-h-0 flex-1 !rounded-none !border-0 !bg-transparent" />
      </div>
      {cinema && (
        <Landscape><Cinema
          contained compact extra={<CaptionMenu needs={needs} up />} stream={stream} eng={eng} viewers={formatCount(stream.viewers)} hostName={host.name} onExit={() => setCinema(false)}
          bursts={<GiftToast bursts={sim.bursts} />}
          captions={pf.captions ? <p key={cap} className={`fade-in max-w-[90%] rounded-lg bg-ink-950/75 px-3 py-1.5 text-center font-medium backdrop-blur ${pf.captionSize === 'S' ? 'text-[12px]' : pf.captionSize === 'L' ? 'text-[17px]' : 'text-[14px]'}`}>{needs && !translate ? line.orig : line.en}</p> : null}
          chat={<ChatPanel msgs={sim.msgs} selfName="You" coins={coins} onGift={onGift} onSend={(x) => sim.send(x, 'You')} locked={eng.chatLock} off={chatOff} className="!h-full !rounded-none !border-0" />}
        /></Landscape>
      )}
      {more && (
        <Sheet onClose={() => setMore(false)} title="More">
          <div className="flex flex-col gap-2 px-5 pb-6">
            <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">Captions</p>
            <Row2 on={pf.captions} onClick={() => setPf('captions', !pf.captions)} icon={<ClosedCaptioning size={22} />} label="Captions" />
            {needs && <Row2 on={pf.translate} onClick={() => setPf('translate', !pf.translate)} icon={<Translate size={22} />} label="Translate to English" />}
            <Row2 on={pf.voiceCaptions} onClick={() => setPf('voiceCaptions', !pf.voiceCaptions)} icon={<SpeakerHigh size={22} />} label="Read aloud" />
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
      )}
      {toast && <div className="pop-in absolute left-1/2 top-24 z-40 -translate-x-1/2 rounded-pill bg-ink-950/90 px-4 py-2 text-sm font-semibold text-fg backdrop-blur">{toast}</div>}
    </div>
    </LiveTheme>
  )
}
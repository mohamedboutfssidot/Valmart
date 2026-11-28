import { VideoSlot } from '../../../components/VideoSlot'
import { cityOf, formatCount, hostOf, type Stream } from '../../../data/mock'
import { matchStreams, suggestions, useRecent, type Suggestion } from './filters'

const ICON: Record<Suggestion['kind'], string> = {
  host: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 8a8 8 0 0 1 16 0',
  city: 'M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  category: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  word: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17l-5-5',
}
const Svg = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-fg-muted" aria-hidden="true"><path d={d} /></svg>
)

/** Search suggestions: recent searches, matching hosts/cities/topics and live videos. */
export function SuggestPanel({ q, streams, onPick, onOpen, big = false }: { q: string; streams: Stream[]; onPick: (v: string) => void; onOpen: (s: Stream) => void; big?: boolean }) {
  const recent = useRecent()
  const typed = q.trim().length > 0
  const sugg = suggestions(q)
  const vids = matchStreams(streams, q, big ? 3 : 4)
  const row = `flex w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-ink-800 active:bg-ink-800 ${big ? 'py-3 text-[16px]' : 'py-2.5 text-[15px]'}`
  return (
    <div className="flex flex-col gap-1 p-2" data-testid="suggest-panel">
      {!typed && recent.list.length > 0 && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-3 pb-1 pt-1">
            <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">Recent</p>
            <button type="button" onClick={recent.clear} className="text-xs font-semibold text-sky-deep">Clear</button>
          </div>
          {recent.list.map((r) => (
            <div key={r} className="flex items-center">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(r)} className={row}><Svg d="M12 7v5l3 2M21 12a9 9 0 1 1-3-6.7" /><span className="truncate">{r}</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => recent.remove(r)} aria-label={`Remove ${r}`} className="grid h-9 w-9 shrink-0 place-items-center text-fg-muted hover:text-fg">
                <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {typed && sugg.length > 0 && (
        <div className="flex flex-col">
          {sugg.map((s) => (
            <button key={s.kind + s.value} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(s.value)} className={row}>
              <Svg d={ICON[s.kind]} /><span className="min-w-0 flex-1 truncate font-medium">{s.label}</span><span className="shrink-0 text-xs text-fg-muted">{s.sub}</span>
            </button>
          ))}
        </div>
      )}
      <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-fg-muted">{typed ? 'Videos that match' : 'Live now, most watched'}</p>
      {vids.length === 0 && <p className="px-3 pb-3 text-sm text-fg-muted">No live video matches yet. Press Enter to search replays too.</p>}
      {vids.map((s) => (
        <button key={s.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onOpen(s)} data-testid="suggest-video" className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-ink-800 active:bg-ink-800">
          <span className="relative block w-[116px] shrink-0 overflow-hidden rounded-lg">
            <VideoSlot stream={s} showLabel={false} className="!aspect-video !w-full !rounded-lg" />
            <span className="absolute bottom-1 left-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">LIVE</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-[14.5px] font-semibold leading-snug">{s.title}</span>
            <span className="mt-0.5 block truncate text-xs text-fg-muted">{hostOf(s.hostId)?.name} · {cityOf(s.cityId).name}</span>
            <span className="block text-xs text-fg-muted">{formatCount(s.viewers)} watching</span>
          </span>
        </button>
      ))}
    </div>
  )
}

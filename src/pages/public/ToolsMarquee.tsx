import { KITS, TOOLS, type ToolDef } from '../../live/tools'
import { ToolIcon } from '../../live/ToolIcon'

const kitLabel = (k: string) => KITS.find((x) => x.id === k)?.label ?? k

function Card({ t }: { t: ToolDef }) {
  return (
    <li className="flex w-[260px] shrink-0 items-center gap-3 rounded-card border border-line bg-ink-800 px-3.5 py-3">
      <span className="ti-badge grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-700 text-sun"><ToolIcon def={t} size={22} /></span>
      <span className="min-w-0">
        <span className="flex items-center gap-2"><b className="truncate text-[15px]">{t.name}</b><span className="shrink-0 rounded-pill bg-ink-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{kitLabel(t.kit)}</span></span>
        <span className="block truncate text-[13px] text-fg-muted">{t.summary}</span>
      </span>
    </li>
  )
}

function Row({ items, reverse, seconds }: { items: ToolDef[]; reverse?: boolean; seconds: number }) {
  return (
    <div className="vm-marquee group relative overflow-hidden" style={{ ['--dur' as string]: `${seconds}s` }}>
      <ul className={`vm-marquee-track flex w-max gap-3 ${reverse ? 'vm-marquee-rev' : ''}`}>
        {[...items, ...items].map((t, i) => <Card key={`${t.id}-${i}`} t={t} />)}
      </ul>
    </div>
  )
}

/** Tools the host can launch, scrolling sideways in two rows. Pauses on hover. */
export function ToolsMarquee() {
  const half = Math.ceil(TOOLS.length / 2)
  return (
    <div className="flex flex-col gap-3 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]" data-testid="tools-marquee" aria-label="Tools a host can launch during a live">
      <Row items={TOOLS.slice(0, half)} seconds={70} />
      <Row items={TOOLS.slice(half)} seconds={80} reverse />
    </div>
  )
}

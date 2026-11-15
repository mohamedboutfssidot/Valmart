import { Icon } from './icons'

export function Sheet({ onClose, children, title }: { onClose: () => void; children: React.ReactNode; title?: string }) {
  return (
    <div className="absolute inset-0 z-40">
      <button type="button" aria-label="Close" onClick={onClose} className="fade-in absolute inset-0 bg-ink-950/60" />
      <div className="sheet-up absolute inset-x-0 bottom-0 flex max-h-[82%] min-h-0 flex-col rounded-t-[28px] border-t border-line bg-ink-900 pb-[env(safe-area-inset-bottom)]" role="dialog" aria-label={title}>
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line" />
        {title && (
          <div className="flex items-center justify-between px-5 pb-1 pt-3">
            <h2 className="font-display text-lg font-bold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-fg-muted active:bg-ink-700"><Icon name="close" size={20} /></button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

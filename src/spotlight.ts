// A soft light follows the pointer inside any block (.rounded-card). Pure CSS variables, no re-render.
export function initSpotlight() {
  if (typeof window === 'undefined' || window.matchMedia?.('(pointer: coarse)').matches) return
  let raf = 0
  window.addEventListener('pointermove', (e) => {
    const el = (e.target as HTMLElement | null)?.closest?.('.rounded-card') as HTMLElement | null
    if (!el) return
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    })
  }, { passive: true })
  // gentle 3D tilt on blocks marked data-tilt
  window.addEventListener('pointermove', (e) => {
    const el = (e.target as HTMLElement | null)?.closest?.('[data-tilt]') as HTMLElement | null
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`)
  }, { passive: true })
  window.addEventListener('pointerout', (e) => {
    const el = (e.target as HTMLElement | null)?.closest?.('[data-tilt]') as HTMLElement | null
    if (el && !el.contains(e.relatedTarget as Node | null)) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') }
  }, { passive: true })
}

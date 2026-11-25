export const $usd = (n: number) => `$${n.toFixed(n % 1 ? 2 : 0)}`
export const $day = (d: string) => { const t = new Date(`${d}T12:00:00`); return Number.isNaN(+t) ? d : t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }

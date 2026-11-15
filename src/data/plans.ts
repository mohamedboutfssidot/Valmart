// Viewer plans. Money buys comfort and reach, never more votes: a vote counts the same on every plan.
export type PlanId = 'free' | 'plus' | 'premium'

export interface Plan {
  id: PlanId
  name: string
  price: number
  blurb: string
  quality: string
  /** "Look here" taps per live */
  looks: number
  /** saved moments kept */
  saved: number
  /** people in a group */
  group: number
  /** trip requests open at once */
  requests: number
  /** viewer polls per live */
  polls: number
  questions: string
  events: string
  recs: string
}

export const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: 0, blurb: 'Everything you need to join a live and take part.', quality: '720p', looks: 0, saved: 10, group: 4, requests: 1, polls: 0, questions: 'Normal', events: 'Standard access', recs: 'Standard' },
  { id: 'plus', name: 'Plus', price: 3.99, blurb: 'Sharper video and more room to point at things.', quality: '1080p', looks: 5, saved: 100, group: 10, requests: 3, polls: 1, questions: 'Normal', events: 'Early access', recs: 'Better' },
  { id: 'premium', name: 'Premium', price: 7.99, blurb: 'The best picture, bigger groups and priority everywhere.', quality: '1080p HD+', looks: Infinity, saved: Infinity, group: 25, requests: 10, polls: 3, questions: 'Highlighted for the host', events: 'Priority access', recs: 'Advanced personalization' },
]

export const planOf = (id: PlanId) => PLANS.find((p) => p.id === id)!
const num = (n: number) => (n === Infinity ? 'Unlimited' : n === 0 ? 'Off' : String(n))

/** Rows of the comparison table: label, then one value per plan. */
export const ROWS: [string, (p: Plan) => string][] = [
  ['Video quality', (p) => p.quality],
  ['Look here, per live', (p) => num(p.looks)],
  ['Saved moments', (p) => num(p.saved)],
  ['People in a group', (p) => String(p.group)],
  ['Viewer polls, per live', (p) => String(p.polls)],
  ['Open trip requests', (p) => String(p.requests)],
  ['Your questions to the host', (p) => p.questions],
  ['Events', (p) => p.events],
  ['Recommendations', (p) => p.recs],
]

export const SAME_FOR_ALL = ['Live, chat and gifts', 'Stay here and Move on', 'Route votes and host tools', 'Full screen and subtitles']
export const price = (p: Plan) => (p.price === 0 ? '$0' : `$${p.price.toFixed(2)}`)

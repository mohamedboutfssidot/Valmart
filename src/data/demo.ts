import type { Category } from './mock'

export interface User {
  id: string; name: string; email: string; interests: Category[]
  isHost: boolean; hostCity?: string; languages: string[]; demo?: 'viewer' | 'host'; bio?: string
}
export interface SessionLog { id: string; title: string; cityId: string; seconds: number; peak: number; gifts: number; coins: number; at: number }
export interface LedgerEntry { id: string; kind: 'gifts' | 'event' | 'boost' | 'trip'; label: string; usd: number; at: number }
export interface GiftLog { id: string; streamId: string; name: string; emoji: string; cost: number; at: number }
export interface Ticket { ref: string; eventId: string; qty: number; at: number }
export interface Moment { id: string; streamId: string; at: number }
export interface HostEvent { id: string; title: string; cityId: string; date: string; price: number; seats: number; sold: number; at: number }

/** Request types live in the store; samples below follow them. */
import type { TripRequest } from '../store'
export const SAMPLE_REQUESTS: TripRequest[] = [
  { id: 'rq1', byId: 'sample-1', byName: 'Sofia R.', cityId: 'istanbul', hostName: '', anyone: true, targets: [], title: 'The spice market before it gets crowded', details: 'Early morning. I would like to see the stalls open and hear how the sellers talk about their goods.', date: '2026-11-14', time: '07:30', budgetUsd: 25, status: 'open', responses: [], msgs: [], at: 1 },
  { id: 'rq2', byId: 'sample-2', byName: 'Class 6B, École Jean Moulin', cityId: 'paris', hostName: 'Léa Marchand', anyone: false, targets: ['Léa Marchand'], title: 'A bakery visit for our French class', details: 'Thirty minutes, slow pace, simple French please. The pupils will prepare their questions.', date: '2026-11-20', time: '10:00', budgetUsd: 40, status: 'open', responses: [], msgs: [], at: 2 },
  { id: 'rq3', byId: 'sample-3', byName: 'Omar K.', cityId: 'marrakech', hostName: '', anyone: true, targets: [], title: 'A tannery and a craft workshop', details: 'I want to understand how the leather is made and meet the people who make it.', date: '2026-11-09', budgetUsd: 30, unlimited: false, status: 'open', responses: [], msgs: [], at: 3 },
]

export interface Seed {
  sessions: SessionLog[]; ledger: LedgerEntry[]; gifts: GiftLog[]; tickets: Ticket[]; moments: Moment[]; visited: string[]
  hostEvents: HostEvent[]
}
export const EMPTY: Seed = { sessions: [], ledger: [], gifts: [], tickets: [], moments: [], visited: [], hostEvents: [] }

// Sample rate: 100 coins = $1 and the host keeps 70%.
export const COINS_PER_USD = 100
export const HOST_SHARE = 0.7
export const giftUsd = (coins: number) => Math.round((coins / COINS_PER_USD) * HOST_SHARE * 100) / 100

export const DEMO_VIEWER: User = {
  id: 'demo-viewer', name: 'Nadia Costa', email: 'nadia@example.com',
  interests: ['Food Journey', 'Night Exploration', 'Hidden Places'], isHost: false, languages: ['English', 'French'], demo: 'viewer',
}
export const DEMO_HOST: User = {
  id: 'demo-host', name: 'Léa Marchand', email: 'lea@example.com',
  interests: ['Discovery', 'Travel Guide'], isHost: true, hostCity: 'paris', languages: ['French', 'English'], demo: 'host',
}

const DAY = 86_400_000

/** Sample history so a demo account never opens empty. Real sign-ups start empty. */
export function seedFor(user: User | null): Seed {
  if (!user?.demo) return EMPTY
  const now = Date.now()
  const sessions: SessionLog[] = user.isHost
    ? [
        { id: 'x1', title: 'Sunset walk from the Seine to the Eiffel Tower', cityId: 'paris', seconds: 3120, peak: 1284, gifts: 41, coins: 4300, at: now - 1 * DAY },
        { id: 'x2', title: 'Montmartre at golden hour', cityId: 'paris', seconds: 2700, peak: 702, gifts: 22, coins: 1900, at: now - 3 * DAY },
        { id: 'x3', title: 'Left Bank bookshops and cafés', cityId: 'paris', seconds: 2400, peak: 530, gifts: 17, coins: 1350, at: now - 4 * DAY },
        { id: 'x4', title: 'Canal Saint-Martin at night', cityId: 'paris', seconds: 3300, peak: 910, gifts: 33, coins: 3100, at: now - 6 * DAY },
        { id: 'x5', title: 'Marais courtyards', cityId: 'paris', seconds: 2100, peak: 460, gifts: 12, coins: 900, at: now - 8 * DAY },
      ]
    : []
  const ledger: LedgerEntry[] = user.isHost
    ? [
        ...sessions.map((s): LedgerEntry => ({ id: `l-${s.id}`, kind: 'gifts', label: `Gifts, ${s.title}`, usd: giftUsd(s.coins), at: s.at })),
        { id: 'l-e1', kind: 'event', label: 'Paris food walk, 42 tickets', usd: 96, at: now - 5 * DAY },
        { id: 'l-b1', kind: 'boost', label: 'Session Boost', usd: -4, at: now - 2 * DAY },
      ]
    : []
  return {
    sessions, ledger,
    gifts: [
      { id: 'g1', streamId: 's1', name: 'Rose', emoji: '🌹', cost: 10, at: now - 1 * DAY },
      { id: 'g2', streamId: 's3', name: 'Coffee', emoji: '☕', cost: 50, at: now - 2 * DAY },
    ],
    tickets: [{ ref: 'VM-E3-DEMO', eventId: 'e3', qty: 2, at: now - 2 * DAY }],
    moments: [{ id: 'm1', streamId: 's1', at: now - 1 * DAY }, { id: 'm2', streamId: 's3', at: now - 2 * DAY }],
    visited: ['s1', 's3', 's2'],
    hostEvents: user.isHost
      ? [{ id: 'he1', title: 'Paris food walk, Marais to Bastille', cityId: 'paris', date: '2026-10-24', price: 12, seats: 60, sold: 42, at: now - 6 * DAY }]
      : [],
  }
}

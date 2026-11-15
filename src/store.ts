import { create } from 'zustand'
import { planOf, type PlanId } from './data/plans'
import { COINS_PER_USD, EMPTY, HOST_SHARE, SAMPLE_REQUESTS, giftUsd, seedFor, type TripRequest, type HostEvent, type GiftLog, type LedgerEntry, type Moment, type SessionLog, type Ticket, type User } from './data/demo'

// Shared demo state. Coins are demo coins: no payment system exists in this prototype.
// Only the signed-in user is kept in the browser's storage. Everything else resets on reload.
const KEY = 'valmart-demo-user'
const TOUR_KEY = 'valmart-tour-done'
const tourWasDone = () => { try { return localStorage.getItem(TOUR_KEY) === '1' } catch { return false } }
const saveTourDone = (v: boolean) => { try { if (v) localStorage.setItem(TOUR_KEY, '1'); else localStorage.removeItem(TOUR_KEY) } catch { /* storage unavailable */ } }
const load = (): User | null => { try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as User) : null } catch { return null } }
const save = (u: User | null) => { try { if (u) localStorage.setItem(KEY, JSON.stringify(u)); else localStorage.removeItem(KEY) } catch { /* storage unavailable */ } }

let n = 0
export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${++n}`

interface DemoState {
  user: User | null
  coins: number
  isPremium: boolean
  plan: PlanId
  trialEndsAt: number | null
  visited: string[]
  moments: Moment[]
  gifts: GiftLog[]
  tickets: Ticket[]
  sessions: SessionLog[]
  ledger: LedgerEntry[]
  hostEvents: HostEvent[]
  tourOpen: boolean
  tourStep: number
  /** The visitor has taken the demo tour: its button goes away. */
  tourDone: boolean
  requests: TripRequest[]

  signIn: (u: User) => void
  signOut: () => void
  patchUser: (p: Partial<User>) => void
  becomeHost: (city: string, languages: string[]) => void
  addHostEvent: (e: Omit<HostEvent, 'id' | 'at' | 'sold'>) => void
  spend: (amount: number) => boolean
  topUp: (amount: number) => void
  togglePremium: () => void
  setPlan: (p: PlanId) => void
  startTrial: () => void
  cancelTrial: () => void
  visit: (streamId: string) => void
  addMoment: (streamId: string) => boolean
  logGift: (g: Omit<GiftLog, 'id' | 'at'>) => void
  addTicket: (t: Omit<Ticket, 'at'>) => void
  endSession: (s: Omit<SessionLog, 'id' | 'at'>) => void
  buyBoost: (name: string, price: number) => void
  setTour: (open: boolean, step?: number) => void
  setStep: (i: number) => void
  postRequest: (r: Pick<TripRequest, 'cityId' | 'hostName' | 'title' | 'details' | 'date' | 'budgetUsd'>) => boolean
  cancelRequest: (id: string) => void
  acceptRequest: (id: string) => void
  completeRequest: (id: string) => void
  counterRequest: (id: string, usd: number, date: string) => void
  answerCounter: (id: string, accept: boolean) => void
  startRequest: (id: string) => void
  rateRequest: (id: string, rating: number, review: string) => void
  reset: () => void
}

const initialUser = load()
const fresh = { coins: 600, isPremium: false, plan: 'free' as PlanId, trialEndsAt: null as number | null }

export const useDemo = create<DemoState>((set, get) => ({
  user: initialUser,
  ...fresh,
  ...seedFor(initialUser),
  tourOpen: false,
  tourStep: 0,
  tourDone: tourWasDone(),
  requests: SAMPLE_REQUESTS,

  signIn: (u) => { save(u); set({ user: u, ...fresh, ...seedFor(u) }) },
  signOut: () => { save(null); set({ user: null, ...fresh, ...EMPTY, tourOpen: false, tourStep: 0, requests: SAMPLE_REQUESTS }) },
  patchUser: (p) => {
    const cur = get().user
    if (!cur) return
    const u = { ...cur, ...p }
    save(u)
    set({ user: u })
  },
  becomeHost: (city, languages) => get().patchUser({ isHost: true, hostCity: city, languages }),
  addHostEvent: (e) => set((s) => ({ hostEvents: [{ ...e, id: uid('he'), at: Date.now(), sold: 0 }, ...s.hostEvents] })),
  spend: (amount) => {
    if (get().coins < amount) return false
    set((s) => ({ coins: s.coins - amount }))
    return true
  },
  topUp: (amount) => set((s) => ({ coins: s.coins + amount })),
  togglePremium: () => set((s) => ({ isPremium: s.plan !== 'premium', plan: s.plan === 'premium' ? 'free' : 'premium', trialEndsAt: null })),
  setPlan: (p) => set({ plan: p, isPremium: p === 'premium', trialEndsAt: null }),
  startTrial: () => set({ isPremium: true, plan: 'premium', trialEndsAt: Date.now() + 7 * 86_400_000 }),
  cancelTrial: () => set({ isPremium: false, plan: 'free', trialEndsAt: null }),
  visit: (streamId) => set((s) => (s.visited.includes(streamId) ? s : { visited: [streamId, ...s.visited] })),
  addMoment: (streamId) => { if (get().moments.length >= planOf(get().plan).saved) return false; set((s) => ({ moments: [{ id: uid('m'), streamId, at: Date.now() }, ...s.moments] })); return true },
  logGift: (g) => set((s) => ({ gifts: [{ ...g, id: uid('g'), at: Date.now() }, ...s.gifts] })),
  addTicket: (t) => set((s) => ({ tickets: [{ ...t, at: Date.now() }, ...s.tickets.filter((x) => x.ref !== t.ref)] })),
  endSession: (x) => set((s) => {
    const at = Date.now()
    const session: SessionLog = { ...x, id: uid('s'), at }
    const entry: LedgerEntry = { id: uid('l'), kind: 'gifts', label: `Gifts, ${x.title}`, usd: giftUsd(x.coins), at }
    return { sessions: [session, ...s.sessions], ledger: [entry, ...s.ledger] }
  }),
  buyBoost: (name, price) => set((s) => ({ ledger: [{ id: uid('l'), kind: 'boost', label: name, usd: -price, at: Date.now() }, ...s.ledger] })),
  setTour: (open, step) => set((s) => {
    const done = s.tourOpen && !open
    if (done) saveTourDone(true)
    return { tourOpen: open, tourStep: step ?? s.tourStep, tourDone: s.tourDone || done }
  }),
  postRequest: (r) => {
    const u = get().user
    const cost = Math.round(r.budgetUsd * COINS_PER_USD)
    if (!u || r.budgetUsd <= 0 || !get().spend(cost)) return false
    set((s) => ({ requests: [{ ...r, id: uid('rq'), byId: u.id, byName: u.name, status: 'open', at: Date.now() }, ...s.requests] }))
    return true
  },
  cancelRequest: (id) => {
    const u = get().user
    const r = get().requests.find((x) => x.id === id)
    if (!u || !r || r.status !== 'open' || r.byId !== u.id) return
    set((s) => ({ coins: s.coins + Math.round(r.budgetUsd * COINS_PER_USD), requests: s.requests.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)) }))
  },
  acceptRequest: (id) => {
    const u = get().user
    if (!u?.isHost) return
    set((s) => ({ requests: s.requests.map((x) => (x.id === id && x.status === 'open' ? { ...x, status: 'accepted', acceptedBy: u.name } : x)) }))
  },
  completeRequest: (id) => {
    const u = get().user
    const r = get().requests.find((x) => x.id === id)
    if (!u || !r || (r.status !== 'accepted' && r.status !== 'live') || r.acceptedBy !== u.name) return
    const usd = Math.round(r.budgetUsd * HOST_SHARE * 100) / 100
    set((s) => ({ requests: s.requests.map((x) => (x.id === id ? { ...x, status: 'done' } : x)), ledger: [{ id: uid('l'), kind: 'trip', label: `Trip request, ${r.title}`, usd, at: Date.now() }, ...s.ledger] }))
  },
  counterRequest: (id, usd, date) => {
    const u = get().user
    if (!u?.isHost || !(usd >= 5) || !date) return
    set((s) => ({ requests: s.requests.map((x) => (x.id === id && x.status === 'open' && x.byId !== u.id ? { ...x, status: 'countered', acceptedBy: u.name, counter: { usd, date, by: u.name } } : x)) }))
  },
  answerCounter: (id, accept) => {
    const u = get().user
    const r = get().requests.find((x) => x.id === id)
    if (!u || !r || r.status !== 'countered' || !r.counter || r.byId !== u.id) return
    if (!accept) return set((s) => ({ requests: s.requests.map((x) => (x.id === id ? { ...x, status: 'open', acceptedBy: undefined, counter: undefined } : x)) }))
    const diff = Math.round((r.counter.usd - r.budgetUsd) * COINS_PER_USD)
    if (diff > 0 && !get().spend(diff)) return
    set((s) => ({ coins: diff < 0 ? s.coins - diff : s.coins, requests: s.requests.map((x) => (x.id === id ? { ...x, status: 'accepted', budgetUsd: r.counter!.usd, date: r.counter!.date, counter: undefined } : x)) }))
  },
  startRequest: (id) => {
    const u = get().user
    set((s) => ({ requests: s.requests.map((x) => (x.id === id && x.status === 'accepted' && x.acceptedBy === u?.name ? { ...x, status: 'live' } : x)) }))
  },
  rateRequest: (id, rating, review) => set((s) => ({ requests: s.requests.map((x) => (x.id === id && x.status === 'done' && x.byId === s.user?.id && !x.rating ? { ...x, rating, review: review.slice(0, 200) } : x)) })),
  setStep: (i) => set({ tourStep: i }),
  // Back to a clean start before showing the demo to someone new. The tour stays open.
  reset: () => { save(null); saveTourDone(false); set({ user: null, ...fresh, ...EMPTY, tourStep: 0, tourDone: false, requests: SAMPLE_REQUESTS }) },
}))

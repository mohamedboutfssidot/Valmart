import { create } from 'zustand'
import { planOf, type PlanId } from './data/plans'
import { isUnread, hostCanSee } from './trips/requestHelpers'
import { COINS_PER_USD, EMPTY, HOST_SHARE, SAMPLE_REQUESTS, giftUsd, seedFor, type HostEvent, type GiftLog, type LedgerEntry, type Moment, type SessionLog, type Ticket, type User } from './data/demo'

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

/** One message in a request's private thread. `sys` lines are system events; `notify` ones also count as unread. */
export interface RequestMsg { id: string; by: string; name: string; text: string; at: number; sys?: 1; notify?: 1 }
/** A host's price and date for an open request. The viewer chooses one. */
export interface RequestResponse { host: string; hostId: string; usd: number; date: string; at: number }

/** A trip a viewer asks for: where, when, how much. Sent to chosen hosts and/or anyone in the city. */
export interface TripRequest {
  id: string; byId: string; byName: string; cityId: string
  /** Legacy single target. Empty means no single host. */
  hostName: string
  /** Hosts the request is sent to (by name). */
  targets?: string[]
  /** Visible to every host of the city. */
  anyone?: boolean
  title: string; details: string; date: string; time?: string
  budgetUsd: number
  /** No budget limit: nothing is held, the host proposes a price. */
  unlimited?: boolean
  party?: { code: string; size: number }
  status: 'open' | 'countered' | 'accepted' | 'live' | 'done' | 'cancelled'
  acceptedBy?: string; at: number
  counter?: { usd: number; date: string; by: string }
  responses?: RequestResponse[]
  msgs?: RequestMsg[]
  /** Per user id: when they last read the thread. */
  readBy?: Record<string, number>
  rating?: number; review?: string
}
export type NewRequest = Pick<TripRequest, 'cityId' | 'hostName' | 'title' | 'details' | 'date' | 'budgetUsd'> & Partial<Pick<TripRequest, 'time' | 'party' | 'targets' | 'anyone' | 'unlimited'>>

const sysMsg = (u: User, text: string, notify = false): RequestMsg => ({ id: uid('m'), sys: 1, ...(notify ? { notify: 1 as const } : {}), by: u.id, name: u.name, text, at: Date.now() })
const withMsg = (x: TripRequest, m: RequestMsg): RequestMsg[] => [...(x.msgs ?? []), m]

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
  postRequest: (r: NewRequest) => boolean
  cancelRequest: (id: string) => void
  acceptRequest: (id: string) => void
  respondRequest: (id: string, usd: number, date: string) => void
  chooseResponse: (id: string, hostName: string) => void
  completeRequest: (id: string) => void
  counterRequest: (id: string, usd: number, date: string) => void
  answerCounter: (id: string, accept: boolean) => void
  startRequest: (id: string) => void
  sendRequestMessage: (id: string, text: string) => void
  markRequestRead: (id: string) => void
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
    if (!u || (!r.unlimited && r.budgetUsd <= 0) || (cost > 0 && !get().spend(cost))) return false
    const req: TripRequest = { ...r, id: uid('rq'), byId: u.id, byName: u.name, status: 'open', at: Date.now(), msgs: [sysMsg(u, `${u.name} sent the request.`)], readBy: { [u.id]: Date.now() } }
    set((s) => ({ requests: [req, ...s.requests] }))
    return true
  },
  cancelRequest: (id) => {
    const u = get().user
    const r = get().requests.find((x) => x.id === id)
    if (!u || !r || r.status !== 'open' || r.byId !== u.id) return
    set((s) => ({ coins: s.coins + Math.round(r.budgetUsd * COINS_PER_USD), requests: s.requests.map((x) => (x.id === id ? { ...x, status: 'cancelled', msgs: withMsg(x, sysMsg(u, 'Request cancelled.')) } : x)) }))
  },
  // A host accepting at the asked price is a response with the request's own price and date.
  acceptRequest: (id) => {
    const q = get().requests.find((x) => x.id === id)
    if (q) get().respondRequest(id, q.budgetUsd, q.date)
  },
  respondRequest: (id, usd, date) => {
    const u = get().user
    const q = get().requests.find((x) => x.id === id)
    if (!u?.isHost || !q || q.status !== 'open' || q.byId === u.id || !hostCanSee(u, q) || !(usd >= 5) || !date) return
    const res: RequestResponse = { host: u.name, hostId: u.id, usd, date, at: Date.now() }
    set((s) => ({ requests: s.requests.map((x) => (x.id === id ? { ...x, responses: [...(x.responses ?? []).filter((y) => y.host !== u.name), res], msgs: withMsg(x, sysMsg(u, `${u.name} responded: $${usd} on ${date}.`, true)) } : x)) }))
  },
  chooseResponse: (id, hostName) => {
    const u = get().user
    const q = get().requests.find((x) => x.id === id)
    const res = q?.responses?.find((y) => y.host === hostName)
    if (!u || !q || !res || q.status !== 'open' || q.byId !== u.id) return
    // The budget was held when posting: pay the difference, or get the surplus back.
    const diff = Math.round((res.usd - q.budgetUsd) * COINS_PER_USD)
    if (diff > 0 && !get().spend(diff)) return
    set((s) => ({ coins: diff < 0 ? s.coins - diff : s.coins, requests: s.requests.map((x) => (x.id === id ? { ...x, status: 'accepted', acceptedBy: hostName, budgetUsd: res.usd, date: res.date, msgs: withMsg(x, sysMsg(u, `${u.name} chose ${hostName}.`, true)) } : x)) }))
  },
  completeRequest: (id) => {
    const u = get().user
    const r = get().requests.find((x) => x.id === id)
    if (!u || !r || (r.status !== 'accepted' && r.status !== 'live') || r.acceptedBy !== u.name) return
    const usd = Math.round(r.budgetUsd * HOST_SHARE * 100) / 100
    set((s) => ({ requests: s.requests.map((x) => (x.id === id ? { ...x, status: 'done', msgs: withMsg(x, sysMsg(u, 'Trip marked as done.')) } : x)), ledger: [{ id: uid('l'), kind: 'trip', label: `Trip request, ${r.title}`, usd, at: Date.now() }, ...s.ledger] }))
  },
  counterRequest: (id, usd, date) => get().respondRequest(id, usd, date),
  answerCounter: (id, accept) => {
    const u = get().user
    const r = get().requests.find((x) => x.id === id)
    if (!u || !r || r.status !== 'countered' || !r.counter || r.byId !== u.id) return
    if (!accept) return set((s) => ({ requests: s.requests.map((x) => (x.id === id ? { ...x, status: 'open', acceptedBy: undefined, counter: undefined, msgs: withMsg(x, sysMsg(u, `${u.name} declined the offer.`)) } : x)) }))
    const diff = Math.round((r.counter.usd - r.budgetUsd) * COINS_PER_USD)
    if (diff > 0 && !get().spend(diff)) return
    set((s) => ({ coins: diff < 0 ? s.coins - diff : s.coins, requests: s.requests.map((x) => (x.id === id ? { ...x, status: 'accepted', budgetUsd: r.counter!.usd, date: r.counter!.date, counter: undefined, msgs: withMsg(x, sysMsg(u, `${u.name} accepted the offer.`)) } : x)) }))
  },
  startRequest: (id) => {
    const u = get().user
    if (!u) return
    set((s) => ({ requests: s.requests.map((x) => (x.id === id && x.status === 'accepted' && x.acceptedBy === u.name ? { ...x, status: 'live', msgs: withMsg(x, sysMsg(u, 'The trip is live now.')) } : x)) }))
  },
  sendRequestMessage: (id, text) => {
    const u = get().user
    const r = get().requests.find((x) => x.id === id)
    const t = (text || '').trim().slice(0, 500)
    if (!u || !r || !t || r.status === 'cancelled' || !(r.byId === u.id || (u.isHost && (r.hostName === u.name || r.acceptedBy === u.name)))) return
    const m: RequestMsg = { id: uid('m'), by: u.id, name: u.name, text: t, at: Date.now() }
    set((s) => ({ requests: s.requests.map((x) => (x.id === id ? { ...x, msgs: withMsg(x, m), readBy: { ...(x.readBy ?? {}), [u.id]: Date.now() } } : x)) }))
  },
  markRequestRead: (id) => {
    const u = get().user
    const r = get().requests.find((x) => x.id === id)
    if (!u || !r || !isUnread(u, r)) return
    set((s) => ({ requests: s.requests.map((x) => (x.id === id ? { ...x, readBy: { ...(x.readBy ?? {}), [u.id]: Date.now() } } : x)) }))
  },
  rateRequest: (id, rating, review) => set((s) => ({ requests: s.requests.map((x) => (x.id === id && x.status === 'done' && x.byId === s.user?.id && !x.rating ? { ...x, rating, review: review.slice(0, 200) } : x)) })),
  setStep: (i) => set({ tourStep: i }),
  // Back to a clean start before showing the demo to someone new. The tour stays open.
  reset: () => { save(null); saveTourDone(false); set({ user: null, ...fresh, ...EMPTY, tourStep: 0, tourDone: false, requests: SAMPLE_REQUESTS }) },
}))

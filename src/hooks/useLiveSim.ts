import { useCallback, useEffect, useReducer, useRef } from 'react'
import { CHAT_POOL, GIFTS, HOST_LINES, ROUTES, VIEWERS, type Gift } from '../data/live'

export interface Msg { id: number; kind: 'chat' | 'gift' | 'host' | 'system'; user: string; text: string; from?: string; gift?: Gift }
export interface Round { idx: number; options: [string, string]; votes: [number, number]; left: number; choice: 0 | 1 | null; resolved: 0 | 1 | null; pause: number }
export interface Burst { id: number; emoji: string; x: number; who: string; name: string }

const ROUND_SECONDS = 20
type NewMsg = Omit<Msg, 'id'>
interface State { msgs: Msg[]; round: Round; bursts: Burst[]; giftCoins: number; giftCount: number; nextId: number }

type Action =
  | { type: 'tick'; add: [number, number]; msgs: NewMsg[] }
  | { type: 'vote'; i: 0 | 1 }
  | { type: 'push'; msg: NewMsg }
  | { type: 'burst'; burst: Burst }
  | { type: 'unburst'; id: number }

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const rand = (n: number) => Math.floor(Math.random() * (n + 1))

function makeRound(cityId: string, idx: number): Round {
  const rounds = ROUTES[cityId] ?? ROUTES.paris
  const [a, b] = rounds[idx % rounds.length]
  return { idx, options: [a, b], votes: [6 + rand(4), 4 + rand(4)], left: ROUND_SECONDS, choice: null, resolved: null, pause: 0 }
}

function append(state: State, incoming: NewMsg[]): State {
  let { nextId, giftCoins, giftCount } = state
  const msgs = [...state.msgs]
  for (const m of incoming) {
    msgs.push({ ...m, id: nextId++ })
    if (m.kind === 'gift' && m.gift) { giftCoins += m.gift.cost; giftCount += 1 }
  }
  return { ...state, msgs: msgs.slice(-60), nextId, giftCoins, giftCount }
}

function makeReducer(cityId: string) {
  return function reducer(state: State, action: Action): State {
    switch (action.type) {
      case 'tick': {
        let s = append(state, action.msgs)
        let r = s.round
        if (r.resolved === null) {
          const votes: [number, number] = [r.votes[0] + action.add[0], r.votes[1] + action.add[1]]
          const left = r.left - 1
          if (left <= 0) {
            const win: 0 | 1 = votes[0] >= votes[1] ? 0 : 1
            r = { ...r, votes, left: 0, resolved: win, pause: 5 }
            s = { ...s, round: r }
            return s
          }
          r = { ...r, votes, left }
        } else if (r.pause > 1) {
          r = { ...r, pause: r.pause - 1 }
        } else {
          r = makeRound(cityId, r.idx + 1)
        }
        return { ...s, round: r }
      }
      case 'vote': {
        const r = state.round
        if (r.resolved !== null || r.choice !== null) return state
        const votes: [number, number] = [...r.votes]
        votes[action.i] += 1
        return { ...state, round: { ...r, votes, choice: action.i } }
      }
      case 'push': return append(state, [action.msg])
      case 'burst': return { ...state, bursts: [...state.bursts, action.burst] }
      case 'unburst': return { ...state, bursts: state.bursts.filter((b) => b.id !== action.id) }
    }
  }
}

export function useLiveSim(cityId: string, hostName: string) {
  const [state, dispatch] = useReducer(makeReducer(cityId), undefined, (): State => {
    const seed: NewMsg[] = [
      { kind: 'system', user: 'Valmart', text: `${hostName} started the session. Say hello.` },
      ...[0, 1, 2].map((i) => ({ kind: 'chat' as const, user: VIEWERS[i].name, from: VIEWERS[i].from, text: CHAT_POOL[i] })),
    ]
    const base: State = { msgs: [], round: makeRound(cityId, 0), bursts: [], giftCoins: 0, giftCount: 0, nextId: 1 }
    return append(base, seed)
  })

  const ticks = useRef(0)
  const burstId = useRef(1)

  const fireBurst = useCallback((emoji: string, who = 'Someone', name = 'a gift') => {
    const id = burstId.current++
    dispatch({ type: 'burst', burst: { id, emoji, x: 50, who, name } })
    window.setTimeout(() => dispatch({ type: 'unburst', id }), 3200)
  }, [])

  useEffect(() => {
    const lines = HOST_LINES[cityId] ?? HOST_LINES.paris
    const timer = window.setInterval(() => {
      ticks.current += 1
      const msgs: NewMsg[] = []
      if (Math.random() < 0.6) {
        const v = pick(VIEWERS)
        msgs.push({ kind: 'chat', user: v.name, from: v.from, text: pick(CHAT_POOL) })
      }
      if (Math.random() < 0.12) {
        const v = pick(VIEWERS)
        const g = pick(GIFTS)
        msgs.push({ kind: 'gift', user: v.name, from: v.from, text: `sent ${g.name}`, gift: g })
        fireBurst(g.emoji, v.name, g.name)
      }
      if (ticks.current % 11 === 0) msgs.push({ kind: 'host', user: hostName, text: pick(lines) })
      dispatch({ type: 'tick', add: [rand(3), rand(3)], msgs })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cityId, hostName, fireBurst])

  const send = useCallback((text: string, user: string, kind: 'chat' | 'host' = 'chat') => {
    const t = text.trim()
    if (t) dispatch({ type: 'push', msg: { kind, user, text: t } })
  }, [])

  const sendGift = useCallback((gift: Gift, user: string) => {
    dispatch({ type: 'push', msg: { kind: 'gift', user, text: `sent ${gift.name}`, gift } })
    fireBurst(gift.emoji, user, gift.name)
  }, [fireBurst])

  const vote = useCallback((i: 0 | 1) => dispatch({ type: 'vote', i }), [])

  return { ...state, send, sendGift, vote, fireBurst }
}

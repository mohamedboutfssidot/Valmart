import type { Round } from '../hooks/useLiveSim'

const ROUND_SECONDS = 20

export function VoteCard({ round, onVote, mode = 'viewer' }: { round: Round; onVote?: (i: 0 | 1) => void; mode?: 'viewer' | 'host' }) {
  const total = round.votes[0] + round.votes[1]
  const pct = round.votes.map((v) => Math.round((v / total) * 100)) as [number, number]
  const done = round.resolved !== null
  const lead = round.votes[0] >= round.votes[1] ? 0 : 1

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-ink-800 p-4 sm:p-5" aria-label="Route vote">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold">{mode === 'host' ? 'Where the audience wants to go' : 'Where next?'}</h2>
          <p className="text-sm text-fg-muted">
            {done ? 'Voting closed' : mode === 'host' ? 'Follow the lead when the timer ends.' : 'The host follows the room. One vote each round.'}
          </p>
        </div>
        <span className="rounded-pill border border-line px-3 py-1 text-sm font-semibold tabular-nums" aria-live="off">
          {done ? 'Closed' : `${round.left}s left`}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-ink-700" role="progressbar" aria-valuemin={0} aria-valuemax={ROUND_SECONDS} aria-valuenow={round.left}>
        <div className="h-full rounded-full bg-sun transition-[width] duration-1000 ease-linear" style={{ width: `${done ? 0 : (round.left / ROUND_SECONDS) * 100}%` }} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {([0, 1] as const).map((i) => {
          const chosen = round.choice === i
          const won = round.resolved === i
          const leading = !done && lead === i
          return (
            <button
              key={i}
              type="button"
              disabled={mode === 'host' || done || round.choice !== null}
              onClick={() => onVote?.(i)}
              className={`relative min-w-0 overflow-hidden rounded-2xl border p-4 text-left transition-colors ${
                won ? 'border-sun' : chosen ? 'border-sky' : 'border-line'
              } ${mode === 'viewer' && !done && round.choice === null ? 'hover:border-sky' : ''}`}
            >
              <span
                className="absolute inset-y-0 left-0 transition-[width] duration-700"
                style={{ width: `${pct[i]}%`, background: won ? 'rgba(250,143,28,.30)' : 'rgba(36,177,244,.20)' }}
                aria-hidden="true"
              />
              <span className="relative flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold leading-tight">{round.options[i]}</span>
                  <span className="mt-1 block text-sm text-fg-muted">
                    {won ? 'The room chose this' : chosen ? 'Your vote' : leading ? 'Leading' : ' '}
                  </span>
                </span>
                <span className="font-display text-2xl font-bold tabular-nums">{pct[i]}%</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

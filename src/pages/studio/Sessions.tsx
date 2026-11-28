import { useDemo } from '../../store'
import { giftUsd } from '../../data/demo'
import { cityOf } from '../../data/mock'
import { Button } from '../../components/ui'
import { HostGate } from './Gates'

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function Sessions() {
  const { user, sessions } = useDemo()
  if (!user?.isHost) return <HostGate what="Sessions" />
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold sm:text-[28px]">Sessions</h1><p className="text-fg-muted">Every walk you streamed, with its audience and income.</p></div>
        <Button to="/studio/go-live" variant="sun">Go live</Button>
      </header>
      {sessions.length ? (
        <div className="overflow-x-auto rounded-card border border-line bg-ink-800">
          <table className="w-full min-w-[640px] text-left">
            <thead className="text-sm text-fg-muted"><tr>
              <th className="px-5 py-3 font-medium">Session</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 text-right font-medium">Length</th>
              <th className="px-5 py-3 text-right font-medium">Peak</th><th className="px-5 py-3 text-right font-medium">Gifts</th><th className="px-5 py-3 text-right font-medium">Earned</th>
            </tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-5 py-3"><span className="block font-medium">{s.title}</span><span className="text-sm text-fg-muted">{cityOf(s.cityId).name}</span></td>
                  <td className="px-5 py-3 text-fg-muted">{new Date(s.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{clock(s.seconds)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{s.peak}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{s.gifts}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">${giftUsd(s.coins).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-card border border-line bg-ink-800 p-8 text-center"><h2 className="text-xl font-semibold">No sessions yet</h2><p className="mt-1 text-fg-muted">Your first walk will show up here.</p></div>
      )}
    </div>
  )
}

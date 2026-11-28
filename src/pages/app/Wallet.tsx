import { useDemo } from '../../store'
import { GiftArt } from '../../live/theme'
import { COINS_PER_USD } from '../../data/demo'
import { Button } from '../../components/ui'

const PACKS = [{ coins: 100, label: 'Starter' }, { coins: 500, label: 'Explorer' }, { coins: 1200, label: 'Traveler' }]

export default function Wallet() {
  const { coins, topUp, gifts } = useDemo()
  return (
    <div className="flex flex-col gap-9">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-[28px]">Wallet</h1>
        <p className="text-fg-muted">Coins are used for gifts in live rooms.</p>
      </header>

      <div className="rounded-card border border-line bg-ink-800 p-6">
        <p className="text-sm text-fg-muted">Balance</p>
        <p className="mt-1 font-display text-4xl font-bold tabular-nums">{coins.toLocaleString('en-US')}<span className="ml-2 text-lg font-medium text-fg-muted">coins</span></p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Add coins</h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {PACKS.map((p) => (
            <li key={p.coins} className="flex min-w-0 flex-col gap-2 rounded-card border border-line bg-ink-800 p-5">
              <h3 className="font-display text-lg font-bold">{p.label}</h3>
              <p className="font-display text-2xl font-bold tabular-nums">{p.coins.toLocaleString('en-US')}</p>
              <p className="text-sm text-fg-muted">${(p.coins / COINS_PER_USD).toFixed(0)} sample price</p>
              <Button variant="ghost" onClick={() => topUp(p.coins)} className="mt-1">Add free demo coins</Button>
            </li>
          ))}
        </ul>
        <p className="text-sm text-fg-muted">No payment system in this prototype. Coins are free here.</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Gifts sent</h2>
        {gifts.length ? (
          <ul className="flex flex-col gap-2.5">
            {gifts.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-4 rounded-card border border-line bg-ink-800 px-4 py-3">
                <span className="flex min-w-0 items-center gap-3"><GiftArt emoji={g.emoji} size={30} /><span className="truncate">{g.name}</span></span>
                <span className="shrink-0 text-sm text-fg-muted tabular-nums">−{g.cost} coins</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-fg-muted">No gifts yet. Send one from any live room.</p>}
      </section>
    </div>
  )
}

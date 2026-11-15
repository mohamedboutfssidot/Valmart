import { Button } from '../../components/ui'

/** Shown in place of a host tool when the account is not a host yet. */
export function HostGate({ what }: { what: string }) {
  return (
    <div className="flex max-w-[560px] flex-col gap-4 rounded-card border border-line bg-ink-800 p-6">
      <h1 className="text-2xl font-bold">{what} is for hosts</h1>
      <p className="text-fg-muted">Set up your host profile to stream, schedule events and earn. It is free and takes a minute.</p>
      <div><Button to="/studio/go-live" variant="sun">Set up host profile</Button></div>
    </div>
  )
}

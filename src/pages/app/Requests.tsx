import { useSearchParams } from 'react-router-dom'
import { RequestsView } from '../../trips/Requests'

export function AppRequests() {
  const [q] = useSearchParams()
  const preset = { cityId: q.get('city') ?? undefined, hostName: q.get('host') ?? undefined }
  return (
    <div className="flex max-w-[980px] flex-col gap-6">
      <header className="flex flex-col gap-1"><h1 className="text-3xl font-extrabold sm:text-4xl">Trip requests</h1><p className="max-w-[60ch] text-fg-muted">Ask for the walk you want, with a date and a budget. Send it to a creator you like or to every host in the city.</p></header>
      <RequestsView side="ask" goLive="/studio/go-live" preset={preset} />
    </div>
  )
}

export function StudioRequests() {
  return (
    <div className="flex max-w-[980px] flex-col gap-6">
      <header className="flex flex-col gap-1"><h1 className="text-3xl font-extrabold sm:text-4xl">Trip requests</h1><p className="max-w-[60ch] text-fg-muted">Viewers ask for walks with a budget. Accept one, film it live, and get paid when it is done.</p></header>
      <RequestsView side="host" goLive="/studio/go-live" />
    </div>
  )
}

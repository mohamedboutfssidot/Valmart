import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Root } from './components/Root'
import { PublicShell } from './components/PublicShell'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import Home from './pages/public/Home'
import Hosts from './pages/public/Hosts'
import Viewers from './pages/public/Viewers'
import Pricing from './pages/public/Pricing'
import Auth from './pages/public/Auth'
import Watch from './pages/public/Watch'
import Discover from './pages/app/Discover'
import City from './pages/app/City'
import Live from './pages/app/Live'
import Profile from './pages/app/Profile'
import { StudioShell } from './components/StudioShell'
import GoLive from './pages/studio/GoLive'
import Earnings from './pages/studio/Earnings'
import Overview from './pages/studio/Overview'
import Sessions from './pages/studio/Sessions'
import HostEvents from './pages/studio/HostEvents'
import Boosts from './pages/studio/Boosts'
import StudioTools from './pages/studio/Tools'
import { CategoriesIndex, CategoryPage } from './pages/app/Categories'
import { ReplaysPage, ReplayWatch } from './pages/app/Replays'
import { StudioReplays } from './pages/app/Community'
import { EventDetail, Events } from './pages/app/Events'
import Sync from './pages/dev/Sync'
import Library from './pages/dev/Library'
import { RoomHub, RoomPage } from './pages/room/RoomPages'
import { AppRequests, StudioRequests } from './pages/app/Requests'
import { AppGroup, HostPage, StudioInsights, StudioPrep, StudioProfile, StudioSafety, StudioSchedule, StudioTeam } from './pages/app/Community'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Root />}>
          <Route element={<PublicShell />}>
            <Route index element={<Home />} />
            <Route path="viewers" element={<Viewers />} />
            <Route path="hosts" element={<Hosts />} />
            <Route path="host/:id" element={<HostPage />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="watch/:id" element={<Watch />} />
            <Route path="signin" element={<Auth />} />
          </Route>
          <Route path="app" element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<Discover />} />
            <Route path="city/:id" element={<City />} />
            <Route path="live" element={<Discover liveOnly />} />
            <Route path="live/:id" element={<Live />} />
            <Route path="room/:code" element={<RoomPage embedded />} />
            <Route path="requests" element={<AppRequests />} />
            <Route path="group" element={<AppGroup />} />
            <Route path="following" element={<Navigate to="/app?following=1" replace />} />
            <Route path="host/:id" element={<HostPage />} />
            <Route path="wallet" element={<Profile tab="wallet" />} />
            <Route path="trips" element={<Navigate to="/app/events" replace />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="replays" element={<ReplaysPage />} />
            <Route path="replay/:id" element={<ReplayWatch />} />
            <Route path="plan" element={<Profile tab="plan" />} />
            <Route path="categories" element={<CategoriesIndex />} />
            <Route path="category/:slug" element={<CategoryPage />} />
            <Route path="settings" element={<Profile tab="profile" />} />
          </Route>
          <Route path="studio" element={<RequireAuth><StudioShell /></RequireAuth>}>
            <Route index element={<Overview />} />
            <Route path="go-live" element={<GoLive />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="events" element={<HostEvents />} />
            <Route path="replays" element={<StudioReplays />} />
            <Route path="tools" element={<StudioTools />} />
            <Route path="boosts" element={<Boosts />} />
            <Route path="requests" element={<StudioRequests />} />
            <Route path="schedule" element={<StudioSchedule />} />
            <Route path="prep" element={<StudioPrep />} />
            <Route path="team" element={<StudioTeam />} />
            <Route path="insights" element={<StudioInsights />} />
            <Route path="profile" element={<StudioProfile />} />
            <Route path="safety" element={<StudioSafety />} />
            <Route path="earnings" element={<Earnings />} />
          </Route>
          <Route path="dev/sync" element={<Sync />} />
          <Route path="dev/library" element={<Library />} />
          <Route path="room" element={<RoomHub />} />
          <Route path="room/:code" element={<RoomPage />} />
          <Route path="app/go-live" element={<Navigate to="/studio/go-live" replace />} />
          <Route path="app/earnings" element={<Navigate to="/studio/earnings" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
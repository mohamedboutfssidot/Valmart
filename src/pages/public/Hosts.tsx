import { Button } from '../../components/ui'
import { Reveal } from '../../components/Reveal'
import { Band, Explorer, Rows } from './ui2'
import { EarningsDemo } from './Demos'

const DO = [
  { title: 'Show your place', body: 'Walk through your neighborhood with your phone and let the room vote on the next turn.' },
  { title: 'Teach what you know', body: 'History, architecture, language, cooking. A session people ask questions about.' },
  { title: 'Host an event', body: 'A festival night or a special route, with limited paid seats and a date to plan around.' },
  { title: 'Accept trip requests', body: 'Viewers ask for a walk with a budget. Accept one, film it, get paid when it is done.' },
  { title: 'Show your craft', body: 'Markets, workshops and tastings from the inside.' },
  { title: 'Build a following', body: 'Reviews and regular viewers grow with every walk.' },
]

const lines = (...l: string[]) => <ul className="flex flex-col gap-2">{l.map((x) => <li key={x} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sun" />{x}</li>)}</ul>
const STUDIO = [
  { tag: 'Go live', title: 'Start from your phone', line: 'Pick the city, name the walk, press start.', demo: lines('Camera and microphone start by themselves', 'Your live appears in Live now', 'Solo mode or control room') },
  { tag: 'Requests', title: 'Trip requests', line: 'Accept, or propose another price or date.', demo: lines('Sent to you, or open in your city', 'First to accept takes it', 'Paid when you mark it done') },
  { tag: 'Schedule', title: 'Announce and prepare', line: 'Reminders for followers, a checklist for you.', demo: lines('Announce a live in advance', 'Checklist and ordered stops to validate', 'Followers get a reminder') },
  { tag: 'Insights', title: 'See what works', line: 'When people leave and which tools they use.', demo: lines('Audience minute by minute', 'Share of viewers per tool', 'Where returning viewers live') },
  { tag: 'Earnings', title: 'One balance', line: 'Gifts, tickets and trip requests together.', demo: lines('Income by source', 'Team share up to 50%', 'Boosts only when you choose') },
  { tag: 'Profile', title: 'Your public page', line: 'Bio, price and reviews.', demo: lines('Request a trip from you', 'Rated by viewers', 'Reviews after each trip') },
]

const PAY = [
  { title: 'Gifts', body: 'Viewers send gifts during a walk. In this sample, 100 coins are worth $1 and the host keeps 70%.' },
  { title: 'Event tickets', body: 'Sell limited seats to a special walk. You set the price and the capacity.' },
  { title: 'Trip requests', body: 'A viewer sets a budget. You keep 70% when the trip is done.' },
]
const FAQ = [
  { title: 'Do I need special equipment?', body: 'No. A phone with a camera and a stable connection is enough.' },
  { title: 'Who can become a host?', body: 'Anyone with a phone and a place to show. No application and no diploma. Viewers rate every session.' },
  { title: 'What if my language is not English?', body: 'Speak your own language. Viewers read the original and their own language, live.' },
  { title: 'What does it cost?', body: 'Nothing to join. Boosts are optional and priced per use.' },
]

export default function Hosts() {
  return (
    <div className="flex flex-col gap-24 md:gap-32">
      <header className="stagger flex max-w-[68ch] flex-col gap-4">
        <p className="w-fit rounded-full border border-line px-3.5 py-1 text-sm font-medium text-sky-soft">For hosts</p>
        <h1 className="text-3xl sm:text-5xl">Earn from what you know about your city</h1>
        <p className="text-lg text-fg-muted">Go live from your phone. Earn from the audience you build.</p>
        <div className="flex flex-wrap gap-3"><Button to="/signin?mode=signup" variant="sun">Create an account to host</Button><Button to="/signin" variant="ghost">I already have one</Button></div>
      </header>

      <Band eyebrow="What hosts do" title="More than going live"><Reveal><div className="max-w-[820px]"><Rows items={DO} /></div></Reveal></Band>
      <Band eyebrow="Studio" title="Your workspace" hint="Pick a tool to see what it does."><Explorer items={STUDIO} /></Band>
      <Band eyebrow="Earnings" title="What could you earn?" hint="Move the sliders."><EarningsDemo /></Band>
      <Band eyebrow="Getting paid" title="Three ways"><div className="max-w-[820px]"><Rows items={PAY} first={0} /></div></Band>
      <Band title="Questions"><div className="max-w-[780px]"><Rows items={FAQ} first={null} /></div></Band>
      <section className="flex flex-col items-start gap-5 border-t border-line pt-12">
        <h2 className="max-w-[18ch] text-4xl font-semibold leading-tight sm:text-6xl">Your first walk is one tap away</h2>
        <Button to="/signin?mode=signup" variant="sun">Become a host</Button>
      </section>
    </div>
  )
}

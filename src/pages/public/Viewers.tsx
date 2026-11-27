import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { PlanCards } from '../../components/PlanBlocks'
import { ToolsMarquee } from './ToolsMarquee'
import { Band, Check, Explorer, Rows, Seg } from './ui2'
import { AudienceDemo, EventDemo, RequestDemo, VoteDemo } from './Demos'

const GESTURES = [
  { tag: 'Vote', title: 'Choose the way', line: 'The host follows the room.', demo: <VoteDemo /> },
  { tag: 'Events', title: 'Join at a set time', line: 'Festivals and tastings with limited seats. Replays stay 48 hours.', demo: <EventDemo /> },
  { tag: 'Request', title: 'Ask for a trip', line: 'Where, when, how much.', demo: <RequestDemo /> },
  { tag: 'Safe', title: 'Made for everyone', line: 'Age labels and a moderated chat.', demo: <AudienceDemo /> },
]
const FAQ = [
  { title: 'Do I need an account to watch?', body: 'Not for the free previews. An account unlocks full lives, votes and requests.' },
  { title: 'How does a trip request cost?', body: 'You set the budget. It is held until the trip is done. In this prototype it is demo money.' },
]

export default function Viewers() {
  return (
    <div className="flex flex-col gap-24 md:gap-32">
      <header className="stagger flex max-w-[68ch] flex-col gap-4">
        <p className="w-fit rounded-pill border border-line px-3.5 py-1 text-sm font-medium text-sky-soft">For viewers</p>
        <h1 className="text-3xl sm:text-5xl">Explore places live, at your own pace</h1>
        <p className="text-lg text-fg-muted">Free to watch. You decide where the walk goes.</p>
        <div className="flex flex-wrap gap-3"><Button to="/signin?mode=signup" variant="sun">Create free account</Button><Button to="/" variant="ghost">See everything on the home page</Button></div>
      </header>

      <Band eyebrow="Try it" title="Four gestures"><Explorer items={GESTURES} /></Band>

      <Band eyebrow="Tools" title="Tools you will answer" hint="A host launches one at a time. You answer in one tap. Hover to pause."><ToolsMarquee /></Band>

      <Band title="Free, Plus or Premium" hint="The plan changes your comfort and your limits, never your vote.">
        <PlanCards cta={<Button to="/signin?mode=signup" variant="ghost">Create free account</Button>} />
        <p className="text-sm text-fg-muted">Premium: 7 days free. <Link to="/pricing" className="font-semibold text-sky-deep hover:underline">Compare every row</Link></p>
      </Band>

      <Band title="Questions"><div className="max-w-[780px]"><Rows items={FAQ} first={null} /></div></Band>
      <section className="flex flex-col items-start gap-5 border-t border-line pt-12"><h2 className="max-w-[18ch] text-4xl font-semibold leading-tight sm:text-6xl">Pick a place. Take the wheel.</h2><Button to="/signin?mode=signup" variant="sun">Create free account</Button></section>
    </div>
  )
}

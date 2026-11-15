// One source of truth for the "what can I do" guide, used by the mobile Guide.
export interface Feature { title: string; body: string }
export interface GuideGroup { id: string; label: string; intro: string; items: Feature[] }

export const GUIDE: GuideGroup[] = [
  { id: 'watch', label: 'Watching', intro: 'What you can do during a live. You are not a spectator, you are in the room.', items: [
    { title: 'Vote on the route', body: 'Every few minutes the host offers two ways to go. The most voted one wins and the host follows it.' },
    { title: 'Look here', body: 'Tap the video to drop a pin on something you want a closer look at. The host sees where the room is pointing.' },
    { title: 'Pace controls', body: 'Ask the host to slow down or speed up without interrupting the walk.' },
    { title: 'Translation and captions', body: 'The host speaks their own language. You read the original and your own language, or hear it read aloud. Caption size is yours to set.' },
    { title: 'Chat and questions', body: 'Talk to the host and to other viewers in a moderated chat. Vote for the question the host answers next.' },
    { title: 'Gifts', body: 'A small gift says thank you in front of everyone. In the prototype, 100 demo coins are worth $1.' },
    { title: 'Save a moment', body: 'Bookmark the best seconds and find them again in My trips.' },
    { title: 'Three ways to take part', body: 'Immersive keeps the video first. Balanced shows one tool at a time. Active opens every tool and pin. Switch any time.' },
    { title: 'Big screen and age labels', body: 'Every live is marked All ages or Adults. Full screen suits a living room.' },
  ] },
  { id: 'requests', label: 'Trip requests', intro: 'Ask for the walk you want. A local makes it happen.', items: [
    { title: '1. Describe it', body: 'Where, what you want to see, the date, and any detail such as language or pace.' },
    { title: '2. Set a budget', body: 'From $5. The amount is held until the trip is done, and refunded if you cancel before anyone accepts.' },
    { title: '3. Choose who', body: 'Send it to one creator you like, or let any host in the city take it. The first to accept gets it.' },
    { title: '4. Watch it live', body: 'The host films your trip and you steer it with votes and questions. The host is paid when it is done and keeps 70%.' },
    { title: 'Counter-offers', body: 'A host can propose another price or date. You accept or decline, and the difference is charged or refunded.' },
    { title: 'Follow the progress', body: 'Posted, accepted, live, done: a simple timeline shows where your request is.' },
    { title: 'Rate the trip', body: 'After the trip you give a mark and a sentence. It appears on the host’s public profile.' },
  ] },
  { id: 'together', label: 'Together', intro: 'Watch with friends, follow the people you like.', items: [
    { title: 'Group', body: 'Add friends, family or a class with a 4-letter code. One person votes for everyone, so the whole group steers as one.' },
    { title: 'Following and alerts', body: 'Follow hosts and cities, get reminders for scheduled lives and an alert when something you care about happens.' },
    { title: 'Host profiles and reviews', body: 'Every host has a public page with languages, price, next lives and reviews. Request a trip from there.' },
  ] },
  { id: 'events', label: 'Events and categories', intro: 'Plan ahead, or follow what you love.', items: [
    { title: 'Events with seats', body: 'Scheduled walks, festivals and tastings with a date and limited tickets. Add a reminder and come back at the time.' },
    { title: '25 categories', body: 'Cultural tour, food, nature, hidden places, night exploration, festival, educational tour and more. Each has its own page.' },
    { title: 'Discover by city', body: 'Open a city to see who is live there now and who is coming next.' },
    { title: 'My trips', body: 'Your saved moments and tickets, kept in one place.' },
  ] },
  { id: 'account', label: 'Account and plans', intro: 'Free to watch. Premium when you want more.', items: [
    { title: 'Free', body: 'Live, chat, votes, tools and gifts at 720p.' },
    { title: 'Plus and Premium', body: 'Sharper video, more Look here, bigger groups and early access. The votes never change: money buys comfort, not power.' },
    { title: 'Wallet', body: 'Demo coins for gifts and trip requests, with a full history of what you spent.' },
    { title: 'Light and dark', body: 'Switch the theme from the header or from Settings. Your choice is remembered.' },
  ] },
  { id: 'hosts', label: 'For hosts', intro: 'All you need is a phone with a camera.', items: [
    { title: 'Go live from the app', body: 'Pick a city, name the walk and start. Your camera and microphone turn on by themselves, and your live appears in Live now.' },
    { title: 'One-button mode', body: 'For solo walkers: the tools run by themselves so you can just talk.' },
    { title: 'Control room', body: 'For a team with a camera operator: choose the tools, watch the votes and steer the room.' },
    { title: 'Tool builder', body: 'Assemble your own tools from bricks: choice, pin, slider, countdown, reveal, chat lock, mission and sound cue.' },
    { title: 'Trip requests', body: 'Accept requests sent to you or open in your city, film them, and get paid when they are done.' },
    { title: 'Events, boosts and earnings', body: 'Sell seats to special walks, buy visibility only when you want it, and follow income from gifts, tickets and trips.' },
    { title: 'Sessions', body: 'Audience, length and income for every walk, so you see what works.' },
    { title: 'Schedule', body: 'Announce a live in advance. Viewers who follow you or your city get a reminder.' },
    { title: 'Trip preparation', body: 'A checklist and an ordered list of stops to validate before the live.' },
    { title: 'Team', body: 'Add a camera operator, a producer or a translator and share a part of the income, up to 50%.' },
    { title: 'Insights', body: 'When viewers leave, which tools make them take part, where returning viewers live.' },
    { title: 'Counter-offers', body: 'Not the right price or date? Propose another one on any trip request.' },
    { title: 'Public profile', body: 'Write your bio and your starting price. It is the page viewers see before they send you a request.' },
  ] },
  { id: 'trust', label: 'Trust and safety', intro: 'Made so everyone can watch with peace of mind.', items: [
    { title: 'Anyone can go live', body: 'A host is a normal person with a camera. Ratings and reports from viewers keep the quality up.' },
    { title: 'Moderated chat', body: 'Respectful by default. Hosts can silence the chat for a moment.' },
    { title: 'Nothing to buy mid-walk', body: 'No ads and no pop-ups during a live. Gifts are optional and never interrupt the walk.' },
    { title: 'Report', body: 'Report a chat, a live, a host or a trip request in two taps. Reports go to a review queue.' },
    { title: 'Protected places', body: 'Hosts can blur an exact location to protect a fragile or private place.' },
  ] },
]

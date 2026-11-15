// Sample events. Dates, prices and capacities are fictional.
export interface EventItem {
  id: string; title: string; cityId: string; hostId: string; when: string; duration: string
  price: number; seats: number; taken: number; blurb: string; boosted?: boolean
}

export const EVENTS: EventItem[] = [
  { id: 'e1', title: 'Cherry blossom night walk', cityId: 'kyoto', hostId: 'h8', when: 'Fri 2 Apr 2027, 20:00 Kyoto time', duration: '90 min', price: 12, seats: 300, taken: 212, boosted: true,
    blurb: 'A slow walk under lit cherry trees along the Philosopher’s Path, with the history of each stop explained as you go.' },
  { id: 'e2', title: 'Carnival in the streets of Lapa', cityId: 'rio', hostId: 'h7', when: 'Fri 5 Feb 2027, 21:00 Rio time', duration: '2 hours', price: 9, seats: 800, taken: 530,
    blurb: 'Follow the blocos through Lapa with a local who knows which stage to catch and which street to skip.' },
  { id: 'e3', title: 'New Year’s Eve at Times Square', cityId: 'nyc', hostId: 'h2', when: 'Thu 31 Dec 2026, 22:30 New York time', duration: '90 min', price: 15, seats: 1000, taken: 640,
    blurb: 'The countdown from the crowd’s point of view, with a host who explains the traditions and takes your questions.' },
  { id: 'e4', title: 'Ramadan evening market', cityId: 'marrakech', hostId: 'h4', when: 'Sat 13 Feb 2027, 19:30 Marrakech time', duration: '75 min', price: 8, seats: 400, taken: 148,
    blurb: 'Taste your way through the stalls after sunset: dates, harira, pastries and the stories behind each one.' },
]
export const eventById = (id: string) => EVENTS.find((e) => e.id === id)

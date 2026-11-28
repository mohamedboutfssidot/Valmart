// Live interaction tools. Everything here is demo data: tools are described as data and
// rendered by one engine, so a host can assemble new ones from bricks (see Builder).
import type { Category } from '../data/mock'

export type Kit = 'base' | 'fear' | 'hidden' | 'travel' | 'food' | 'culture' | 'nature' | 'event' | 'adventure' | 'custom'
export type Kind = 'choice' | 'slider' | 'pin' | 'mission' | 'lock' | 'question'
export type Effect = 'dim' | 'lockchat' | 'blur' | null
export type BrickId = 'choice' | 'pin' | 'slider' | 'countdown' | 'reveal' | 'lock' | 'mission' | 'sound'

export interface Reveal {
  text: string
  /** choice: only reveal when this option wins */
  option?: number
  /** slider: only reveal when the crowd average reaches this value */
  gte?: number
  /** shown instead when the condition is not met */
  alt?: string
}

export interface ToolDef {
  id: string
  name: string
  kit: Kit
  kind: Kind
  prompt: string
  summary: string
  seconds: number
  options?: string[]
  /** question tool: host answer per question */
  answers?: string[]
  min?: number
  max?: number
  unit?: string
  reveal?: Reveal
  effect?: Effect
  sound?: string
  /** save a moment to the viewer's journal when they take part */
  save?: boolean
  /** where the simulated crowd leans (choice weights, slider target) */
  lean?: number[] | number
  bricks: BrickId[]
}

export const KITS: { id: Kit; label: string; blurb: string }[] = [
  { id: 'base', label: 'Base', blurb: 'Works in every category' },
  { id: 'fear', label: 'Fear', blurb: 'Horror and night walks' },
  { id: 'hidden', label: 'Hidden places', blurb: 'Secret spots and clues' },
  { id: 'travel', label: 'Travel', blurb: 'Guides, daily life and transport' },
  { id: 'food', label: 'Food', blurb: 'Markets, street food, tastings' },
  { id: 'culture', label: 'Culture', blurb: 'History, art, lessons' },
  { id: 'nature', label: 'Nature', blurb: 'Wildlife, calm, weather' },
  { id: 'event', label: 'Event', blurb: 'Festivals, music, sport' },
  { id: 'adventure', label: 'Adventure', blurb: 'Risk, survival, storms' },
]

export const BRICKS: { id: BrickId; label: string; hint: string }[] = [
  { id: 'choice', label: 'Choice', hint: '2 to 4 options' },
  { id: 'pin', label: 'Pin on the image', hint: 'Viewers tap the video' },
  { id: 'slider', label: 'Slider', hint: 'A value from 0 to 10' },
  { id: 'countdown', label: 'Countdown', hint: 'Closes by itself' },
  { id: 'reveal', label: 'Reveal', hint: 'Unlocks a clue' },
  { id: 'lock', label: 'Chat lock', hint: 'Silence the chat' },
  { id: 'mission', label: 'Mission', hint: 'One thing to do' },
  { id: 'sound', label: 'Sound cue', hint: 'Ambient sound label' },
]

export const TOOLS: ToolDef[] = [
  // Base kit: works in every category. (Quick poll was removed: Stay here / Move on already does it for viewers.)
  { id: 'where', name: 'Where next?', kit: 'base', kind: 'choice', prompt: 'Which way should I go?', summary: 'Left or right at the corner', seconds: 20, options: ['Left, the narrow street', 'Right, the open square'], lean: [2, 3], bricks: ['choice', 'countdown'] },
  { id: 'silence', name: 'Silence chat', kit: 'base', kind: 'lock', prompt: 'Chat is paused for a moment', summary: 'Pause the chat for 30 seconds', seconds: 30, effect: 'lockchat', bricks: ['lock', 'countdown'] },
  { id: 'spot', name: 'Spot it', kit: 'base', kind: 'mission', prompt: 'Find something red in the scene', summary: 'One small mission for everyone', seconds: 25, reveal: { text: 'Found by most of the room: the red awning on the left.' }, bricks: ['mission', 'reveal', 'countdown'] },

  // Fear kit
  { id: 'torch', name: 'Torch', kit: 'fear', kind: 'choice', prompt: 'Turn the torch off for 10 seconds?', summary: 'Vote to kill the light', seconds: 15, options: ['Off', 'Keep it on'], lean: [3, 2], effect: 'dim', sound: 'Low hum', reveal: { text: 'The lights go out. Listen.', option: 0, alt: 'The light stays on. For now.' }, bricks: ['choice', 'countdown', 'sound', 'reveal'] },
  { id: 'listen', name: 'Listen', kit: 'fear', kind: 'pin', prompt: 'Where did that sound come from? Tap the image.', summary: 'Pin where you heard it', seconds: 20, sound: 'Footsteps', reveal: { text: 'The host turns toward the most pinned spot.' }, bricks: ['pin', 'countdown', 'sound'] },
  { id: 'dontlook', name: 'Don’t turn around', kit: 'fear', kind: 'choice', prompt: 'Something is behind the host.', summary: 'Look back or keep walking', seconds: 15, options: ['Look back', 'Keep walking'], lean: [2, 3], reveal: { text: 'A door swings shut behind us.', option: 0, alt: 'Nothing follows. You will never know.' }, sound: 'Creak', bricks: ['choice', 'reveal', 'sound'] },
  { id: 'fear', name: 'Fear meter', kit: 'fear', kind: 'slider', prompt: 'How scared are you?', summary: 'Crowd fear from 0 to 10', seconds: 20, min: 0, max: 10, lean: 7.4, reveal: { text: 'Hidden room unlocked: the host steps inside.', gte: 7, alt: 'Too calm. The host keeps walking.' }, bricks: ['slider', 'countdown', 'reveal'] },

  // Hidden places kit
  { id: 'entrance', name: 'Where is the entrance?', kit: 'hidden', kind: 'pin', prompt: 'Tap where the secret passage is.', summary: 'Pin the hidden entrance', seconds: 20, reveal: { text: 'The real passage: the low green door. 58% of pins landed within reach.' }, bricks: ['pin', 'countdown', 'reveal'] },
  { id: 'clues', name: 'Clue chain', kit: 'hidden', kind: 'choice', prompt: 'Clue 1: “Flour and fire, open before dawn.” What is behind the door?', summary: 'Guess the place from clues', seconds: 20, options: ['A bakery', 'A workshop', 'A hidden bar'], lean: [4, 2, 1], reveal: { text: 'It was a bakery. Clue 2 unlocks at the next corner.', option: 0, alt: 'Not quite. It was the old bakery.' }, bricks: ['choice', 'countdown', 'reveal'] },
  { id: 'secret', name: 'Secret level', kit: 'hidden', kind: 'slider', prompt: 'How secret does this place feel?', summary: 'Tourist trap to unknown', seconds: 20, min: 0, max: 10, lean: 8.1, reveal: { text: 'Score added to the place card for other explorers.' }, bricks: ['slider', 'countdown', 'reveal'] },
  { id: 'discretion', name: 'Discretion', kit: 'hidden', kind: 'lock', prompt: 'Exact location is hidden to protect this place', summary: 'Blur the location for 45 seconds', seconds: 45, effect: 'blur', bricks: ['lock', 'countdown'] },
  { id: 'mark', name: 'Mark the spot', kit: 'hidden', kind: 'mission', prompt: 'Keep this place in your secret map.', summary: 'Saved to the viewer’s journal', seconds: 20, save: true, reveal: { text: 'Added to your journal in My trips.' }, bricks: ['mission', 'reveal', 'countdown'] },

  // Travel kit
  { id: 'ask', name: 'Ask a local', kit: 'travel', kind: 'question', prompt: 'Vote for the question the host answers next.', summary: 'Questions ranked by the room', seconds: 25, options: ['Where do locals eat?', 'Is it safe at night?', 'Best time to visit?'], answers: ['Two streets up, the place without a menu. Ask for the lunch plate.', 'Yes on this street. Avoid the park after 11 pm.', 'Early morning in spring, before the tour buses arrive.'], lean: [4, 2, 3], bricks: ['choice', 'countdown', 'reveal'] },
  { id: 'price', name: 'How much is it?', kit: 'travel', kind: 'slider', prompt: 'Guess the price of this street snack.', summary: 'Guess, then the real price', seconds: 20, min: 0, max: 10, unit: '$', lean: 4.2, reveal: { text: 'Real price: $3.50. Locals pay less than tourists.' }, bricks: ['slider', 'countdown', 'reveal'] },
  { id: 'say', name: 'Say it', kit: 'travel', kind: 'mission', prompt: 'Repeat after the host: “Merci beaucoup”.', summary: 'A phrase to repeat', seconds: 20, sound: 'Host voice', reveal: { text: 'Great. Locals smile when you try.' }, bricks: ['mission', 'sound', 'reveal'] },
  { id: 'postcard', name: 'Postcard', kit: 'travel', kind: 'pin', prompt: 'Tap the best viewpoint for a postcard.', summary: 'The frame becomes a keepsake', seconds: 20, save: true, reveal: { text: 'The host freezes the most tapped frame. Saved to your journal.' }, bricks: ['pin', 'countdown', 'reveal'] },

  // Food kit
  { id: 'order', name: 'What should I order?', kit: 'food', kind: 'choice', prompt: 'Which one should I order?', summary: 'The room picks the dish', seconds: 20, options: ['The grilled skewers', 'The soup of the day', 'The sweet pastry'], lean: [4, 2, 3], reveal: { text: 'The host orders it. First bite in a moment.' }, bricks: ['choice', 'countdown', 'reveal'] },
  { id: 'spice', name: 'Spice level', kit: 'food', kind: 'slider', prompt: 'How spicy should it be?', summary: 'Crowd spice level from 0 to 10', seconds: 20, min: 0, max: 10, lean: 6.5, reveal: { text: 'Spice level locked. The host is brave, or not.', gte: 7, alt: 'Mild it is. Locals smile.' }, bricks: ['slider', 'countdown', 'reveal'] },
  { id: 'bite', name: 'Rate the bite', kit: 'food', kind: 'slider', prompt: 'How good is it?', summary: 'Rating after the first bite', seconds: 15, min: 0, max: 10, lean: 8.2, reveal: { text: 'Added to the place card as the room score.' }, bricks: ['slider', 'countdown', 'reveal'] },

  // Culture kit
  { id: 'era', name: 'Guess the century', kit: 'culture', kind: 'choice', prompt: 'When was this building made?', summary: 'A small quiz with a reveal', seconds: 20, options: ['12th century', '16th century', '19th century'], lean: [2, 4, 2], reveal: { text: 'Built in the 16th century, restored in 1890.', option: 1, alt: 'Close. It is from the 16th century.' }, bricks: ['choice', 'countdown', 'reveal'] },
  { id: 'story', name: 'Choose the story', kit: 'culture', kind: 'question', prompt: 'Which story should the host tell next?', summary: 'Stories ranked by the room', seconds: 25, options: ['The founder', 'The lost door', 'The festival'], answers: ['He built it with his own hands over nine winters.', 'Locals say it opens once a year, at dawn.', 'Every spring the whole street is covered in lanterns.'], lean: [2, 4, 3], bricks: ['choice', 'countdown', 'reveal'] },
  { id: 'detail', name: 'Spot the detail', kit: 'culture', kind: 'pin', prompt: 'Tap the oldest part of the wall.', summary: 'Pin a detail on the image', seconds: 20, reveal: { text: 'The stones near the arch are the original ones.' }, bricks: ['pin', 'countdown', 'reveal'] },

  // Nature kit
  { id: 'animal', name: 'Find the animal', kit: 'nature', kind: 'pin', prompt: 'Something is hiding. Tap where you see it.', summary: 'Pin the animal in the scene', seconds: 25, reveal: { text: 'Found it: top right, in the branches.' }, bricks: ['pin', 'countdown', 'reveal'] },
  { id: 'birdsong', name: 'Name that sound', kit: 'nature', kind: 'choice', prompt: 'Which animal is singing?', summary: 'Listen, then choose', seconds: 20, options: ['A thrush', 'A frog', 'An owl'], lean: [2, 3, 3], sound: 'Birdsong', reveal: { text: 'It was a thrush, at the top of the oak.', option: 0, alt: 'Not this time. It was a thrush.' }, bricks: ['choice', 'sound', 'reveal'] },
  { id: 'calmness', name: 'Calm meter', kit: 'nature', kind: 'slider', prompt: 'How calm do you feel right now?', summary: 'Room calm from 0 to 10', seconds: 20, min: 0, max: 10, lean: 8.4, reveal: { text: 'The room is calm. The host slows down and listens.' }, bricks: ['slider', 'countdown', 'reveal'] },

  // Event kit
  { id: 'cheer', name: 'Cheer meter', kit: 'event', kind: 'slider', prompt: 'How loud is the room?', summary: 'Crowd energy from 0 to 10', seconds: 15, min: 0, max: 10, lean: 8.8, reveal: { text: 'The crowd roars. The host raises the camera.' }, bricks: ['slider', 'countdown', 'reveal'] },
  { id: 'nextact', name: 'Next act', kit: 'event', kind: 'choice', prompt: 'Which stage should we visit next?', summary: 'The room picks the stage', seconds: 20, options: ['Main stage', 'Street band', 'Food court'], lean: [4, 3, 2], bricks: ['choice', 'countdown'] },
  { id: 'wave', name: 'Do the wave', kit: 'event', kind: 'mission', prompt: 'Cheer together when the countdown ends.', summary: 'Everyone cheers together', seconds: 15, reveal: { text: 'Wave sent. The host waves back.' }, bricks: ['mission', 'countdown', 'reveal'] },

  // Adventure kit
  { id: 'go', name: 'Go or no go?', kit: 'adventure', kind: 'choice', prompt: 'Cross the rope bridge?', summary: 'A risk vote', seconds: 20, options: ['Go', 'No go'], lean: [3, 2], reveal: { text: 'The host crosses, slowly.', option: 0, alt: 'The host turns back and finds another way.' }, bricks: ['choice', 'countdown', 'reveal'] },
  { id: 'risk', name: 'Risk level', kit: 'adventure', kind: 'slider', prompt: 'How risky does this look?', summary: 'Crowd risk from 0 to 10', seconds: 20, min: 0, max: 10, lean: 6.2, reveal: { text: 'Risk is high. The host checks the gear first.', gte: 7, alt: 'Acceptable. The host goes on.' }, bricks: ['slider', 'countdown', 'reveal'] },
  { id: 'gear', name: 'Gear check', kit: 'adventure', kind: 'mission', prompt: 'Spot what the host forgot.', summary: 'A small mission for the room', seconds: 25, reveal: { text: 'Most of the room saw it: no spare water.' }, bricks: ['mission', 'reveal', 'countdown'] },
]

export const toolById = (id: string, custom: ToolDef[] = []) => [...TOOLS, ...custom].find((t) => t.id === id)

const KIT_OF: Record<string, Kit> = {
  'Horror': 'fear', 'Night Exploration': 'fear',
  'Hidden Places': 'hidden', 'Urban Exploration': 'hidden',
  'Food Journey': 'food', 'Street Food Market': 'food',
  'Cultural Tour': 'culture', 'Educational Tour': 'culture', 'Art & Museums': 'culture', 'History & Heritage': 'culture', 'Language & Lessons': 'culture',
  'Nature Walk': 'nature', 'Wildlife & Safari': 'nature', 'Relax / Ambient': 'nature',
  'Festival / Event': 'event', 'Nightlife & Music': 'event', 'Sports & Fitness': 'event',
  'Adventure': 'adventure', 'Survival-Style': 'adventure', 'Weather & Storms': 'adventure',
}
export function kitFor(category: Category | string): Kit {
  return KIT_OF[category] ?? 'travel'
}

export const kitLabel = (k: Kit) => (k === 'custom' ? 'Your tools' : KITS.find((x) => x.id === k)!.label)

export const MODES = ['Immersive', 'Balanced', 'Active'] as const
export type Mode = (typeof MODES)[number]
export const MODE_NOTE: Record<Mode, string> = {
  Immersive: 'Video first. Only a few tools appear, and they stay small.',
  Balanced: 'One tool at a time, calm timing. The default.',
  Active: 'All tools, pins and map open. For people who want to steer.',
}
/** seconds between host tools in the simulated room, per mode */
export const AUTO_EVERY: Record<Mode, number> = { Immersive: 70, Balanced: 38, Active: 32 }

/**
 * Ready-made alternatives for each tool, so the host can swap the wording in one tap
 * (or type their own, or add more options). Only what changes is listed.
 */
export interface Suggestion { label: string; prompt?: string; options?: string[]; reveal?: string }
export const SUGGEST: Record<string, Suggestion[]> = {
  where: [
    { label: 'Straight or back', options: ['Keep going straight', 'Turn back'] },
    { label: 'Street or square', options: ['The busy street', 'The quiet square', 'The side alley'] },
    { label: 'Eat or explore', prompt: 'What should we do next?', options: ['Find something to eat', 'Keep exploring'] },
  ],
  silence: [
    { label: 'Short pause', prompt: 'Chat is paused for a few seconds' },
    { label: 'Listen with me', prompt: 'Chat is paused. Listen to the street.' },
  ],
  spot: [
    { label: 'Something old', prompt: 'Find the oldest thing in the scene' },
    { label: 'A sign', prompt: 'Find a sign in a language you do not read' },
    { label: 'A colour', prompt: 'Find something blue in the scene' },
  ],
  torch: [
    { label: 'Light on or off', prompt: 'Switch the light off for 10 seconds?', options: ['Off', 'On'] },
    { label: 'Darker', prompt: 'Should we walk without light?', options: ['Yes, lights out', 'No, keep it'] },
  ],
  listen: [
    { label: 'Footsteps', prompt: 'Where are the footsteps coming from? Tap the image.' },
    { label: 'A voice', prompt: 'Where did the voice come from? Tap the image.' },
  ],
  dontlook: [
    { label: 'Behind me', prompt: 'Did you hear that behind me?', options: ['Check it', 'Ignore it'] },
    { label: 'Three choices', prompt: 'A door is open ahead.', options: ['Go in', 'Walk past', 'Close it'] },
  ],
  fear: [
    { label: 'Tension', prompt: 'How tense is this place?' },
    { label: 'Unease', prompt: 'How uneasy do you feel right now?' },
  ],
  entrance: [
    { label: 'The door', prompt: 'Tap where the door is.' },
    { label: 'A way in', prompt: 'Tap the way in.' },
  ],
  clues: [
    { label: 'A shop', prompt: 'Clue: “Open at night, smells of sugar.” What is it?', options: ['A pastry shop', 'A bar', 'A market'] },
    { label: 'A place', prompt: 'Clue: “Stone steps, a hidden garden.” Where are we?', options: ['A park', 'A courtyard', 'A museum'] },
  ],
  secret: [
    { label: 'Locals only', prompt: 'How much does this feel like a local place?' },
    { label: 'Crowded', prompt: 'How crowded does it feel?' },
  ],
  discretion: [
    { label: 'Longer blur', prompt: 'The exact place stays private' },
  ],
  mark: [
    { label: 'Save it', prompt: 'Save this place to your journal.' },
    { label: 'Come back', prompt: 'Keep this place for a later trip.' },
  ],
  ask: [
    { label: 'Everyday life', options: ['What do you eat every day?', 'How long is your commute?', 'What changed here lately?'] },
    { label: 'Visiting', options: ['What should I skip?', 'Best street for a walk?', 'What is a fair price here?'] },
  ],
  price: [
    { label: 'A drink', prompt: 'Guess the price of this drink.' },
    { label: 'A ticket', prompt: 'Guess the price of the entry ticket.' },
  ],
  say: [
    { label: 'Hello', prompt: 'Repeat after the host: “Hello, good morning”.' },
    { label: 'Thank you', prompt: 'Repeat after the host: “Thank you very much”.' },
  ],
  postcard: [
    { label: 'Best angle', prompt: 'Tap the best angle for a photo.' },
    { label: 'Skyline', prompt: 'Tap the best part of the skyline.' },
  ],
  order: [
    { label: 'Hot or sweet', options: ['Something hot', 'Something sweet'] },
    { label: 'Local picks', options: ['The house special', 'The cheapest dish', 'What the locals order'] },
  ],
  spice: [
    { label: 'Heat', prompt: 'How hot should I go?' },
    { label: 'Challenge', prompt: 'How brave should I be?' },
  ],
  bite: [
    { label: 'Worth it', prompt: 'Is it worth the queue?' },
    { label: 'Flavour', prompt: 'How strong is the flavour?' },
  ],
  era: [
    { label: 'Decade', prompt: 'When was this street built?', options: ['Before 1800', '1800-1900', 'After 1900'] },
    { label: 'Use', prompt: 'What was this building first used for?', options: ['A house', 'A workshop', 'A temple'] },
  ],
  story: [
    { label: 'Local legends', options: ['The founder', 'The legend', 'The last night'] },
    { label: 'Small stories', options: ['The first shop', 'The old tree', 'The big flood'] },
  ],
  detail: [
    { label: 'A carving', prompt: 'Tap the most detailed carving.' },
    { label: 'A repair', prompt: 'Tap where it was repaired.' },
  ],
  animal: [
    { label: 'Bird', prompt: 'Tap where you see the bird.' },
    { label: 'Movement', prompt: 'Something moved. Tap where.' },
  ],
  birdsong: [
    { label: 'Which sound', prompt: 'What is making this sound?', options: ['A bird', 'Wind', 'Water'] },
    { label: 'Two choices', prompt: 'Is it close or far?', options: ['Close', 'Far'] },
  ],
  calmness: [
    { label: 'Peace', prompt: 'How peaceful is this place?' },
    { label: 'Rest', prompt: 'Could you rest here?' },
  ],
  cheer: [
    { label: 'Energy', prompt: 'How strong is the energy?' },
    { label: 'Dance', prompt: 'How much do you want to dance?' },
  ],
  nextact: [
    { label: 'Two stages', options: ['Stage one', 'Stage two'] },
    { label: 'Music or food', prompt: 'Where next?', options: ['The music', 'The food', 'The crowd'] },
  ],
  wave: [
    { label: 'Clap', prompt: 'Clap together when the countdown ends.' },
    { label: 'Say hi', prompt: 'Say hi to the crowd in chat when the countdown ends.' },
  ],
  go: [
    { label: 'Climb', prompt: 'Climb to the top?', options: ['Climb', 'Stay down'] },
    { label: 'Three ways', prompt: 'Which path?', options: ['The high path', 'The river path', 'Turn back'] },
  ],
  risk: [
    { label: 'Weather', prompt: 'How bad does the weather look?' },
    { label: 'Path', prompt: 'How safe is this path?' },
  ],
  gear: [
    { label: 'Safety', prompt: 'Spot what is missing from the safety kit.' },
    { label: 'Pack', prompt: 'Spot what I should leave behind.' },
  ],
}

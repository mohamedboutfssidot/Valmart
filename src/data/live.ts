// Scripted content for the simulated live room. Everything here is fictional.

export interface Gift { id: string; name: string; emoji: string; cost: number }
export const GIFTS: Gift[] = [
  { id: 'rose', name: 'Rose', emoji: '🌹', cost: 10 },
  { id: 'icecream', name: 'Ice cream', emoji: '🍦', cost: 20 },
  { id: 'coffee', name: 'Coffee', emoji: '☕', cost: 50 },
  { id: 'balloon', name: 'Balloon', emoji: '🎈', cost: 80 },
  { id: 'lantern', name: 'Lantern', emoji: '🏮', cost: 100 },
  { id: 'star', name: 'Star', emoji: '⭐', cost: 200 },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', cost: 300 },
  { id: 'fireworks', name: 'Fireworks', emoji: '🎆', cost: 500 },
  { id: 'crown', name: 'Crown', emoji: '👑', cost: 800 },
  { id: 'gem', name: 'Gem', emoji: '💎', cost: 1000 },
]

// Each city has three vote rounds, each with two options.
export const ROUTES: Record<string, [string, string][]> = {
  paris: [['Along the Seine', 'Up to Montmartre'], ['Cross Pont Neuf', 'Cut through the Tuileries'], ['Café stop', 'Straight to the tower']],
  nyc: [['Toward the lake', 'Toward the street performers'], ['Through the Ramble', 'Along the Mall'], ['Hot dog cart', 'The boathouse']],
  tokyo: [['Down the main street', 'Into the side alleys'], ['Ramen counter', 'Arcade'], ['Rooftop view', 'Shrine steps']],
  marrakech: [['Into the spice stalls', 'Toward the storytellers'], ['Orange juice stand', 'Tagine stall'], ['Rooftop terrace', 'Back alleys of the souk']],
  rome: [['Toward the fountain', 'Into the courtyards'], ['Gelato first', 'Straight to the dome'], ['Ancient wall', 'Quiet church']],
  istanbul: [['Board the ferry', 'Walk the pier'], ['Spice bazaar', 'Tea garden'], ['Galata steps', 'Fish sandwich stands']],
  rio: [['Follow the drums', 'Climb to the arches'], ['Street food corner', 'Rehearsal stage'], ['Samba circle', 'Quiet side street']],
  kyoto: [['Down Hanamikoji', 'Along the canal'], ['Tea house', 'Stone lanterns'], ['Bamboo path', 'Small shrine']],
}

export const HOST_LINES: Record<string, string[]> = {
  paris: ['Watch the light on the water here.', 'The bridge is about to give us a great view.', 'Ask me anything about the neighbourhood.'],
  nyc: ['This path is quieter than the main loop.', 'You can hear the musicians from here.', 'Tell me if you want me to slow down.'],
  tokyo: ['Notice how the signs change block by block.', 'Let me know which alley looks best.', 'Almost at the crossing now.'],
  marrakech: ['Stay close, the square gets busy.', 'These stalls open before sunrise.', 'Tell me what you want a closer look at.'],
  rome: ['This courtyard is easy to miss.', 'Smell that? Coffee, two doors down.', 'The dome is just behind these roofs.'],
  istanbul: ['The ferry crossing takes about twenty minutes.', 'The bazaar is right around the corner.', 'Tea first, then we keep walking.'],
  rio: ['Hear the drums? They are rehearsing.', 'The arches are a short walk from here.', 'Vote and I will follow the crowd.'],
  kyoto: ['It is very quiet at this hour.', 'These lanterns are lit every evening.', 'Keep your votes coming.'],
}

// What the host says, in their own language, with an English line for live translation.
export const NARRATION: Record<string, { orig: string; en: string }[]> = {
  paris: [
    { orig: 'On longe la Seine, regardez la lumière sur l’eau.', en: 'We’re walking along the Seine, look at the light on the water.' },
    { orig: 'La tour Eiffel apparaît juste après le pont.', en: 'The Eiffel Tower appears just after the bridge.' },
    { orig: 'Ici, on trouve les meilleures crêpes du quartier.', en: 'Here you’ll find the neighbourhood’s best crêpes.' },
  ],
  nyc: [
    { orig: 'We’re heading toward the lake, the light is perfect.', en: 'We’re heading toward the lake, the light is perfect.' },
    { orig: 'Listen, you can hear a saxophone ahead.', en: 'Listen, you can hear a saxophone ahead.' },
    { orig: 'This is one of the oldest paths in the park.', en: 'This is one of the oldest paths in the park.' },
  ],
  tokyo: [
    { orig: 'ここがあの有名なスクランブル交差点です。', en: 'This is the famous scramble crossing.' },
    { orig: '夜の渋谷はネオンがとてもきれいです。', en: 'Shibuya at night has beautiful neon lights.' },
    { orig: '小さな路地に入ってみましょう。', en: 'Let’s step into a small alley.' },
  ],
  marrakech: [
    { orig: 'Écoutez les musiciens sur la place.', en: 'Listen to the musicians in the square.' },
    { orig: 'Ici, on vend les meilleures épices de la ville.', en: 'They sell the best spices in town here.' },
    { orig: 'Attention, la place devient très animée le soir.', en: 'Careful, the square gets very lively in the evening.' },
  ],
  rome: [
    { orig: 'Siamo dietro il Pantheon, in un cortile nascosto.', en: 'We’re behind the Pantheon, in a hidden courtyard.' },
    { orig: 'Sentite il profumo del caffè?', en: 'Can you smell the coffee?' },
    { orig: 'Questa strada è molto antica.', en: 'This street is very old.' },
  ],
  istanbul: [
    { orig: 'Vapura biniyoruz, Boğaz çok güzel.', en: 'We’re boarding the ferry, the Bosphorus is beautiful.' },
    { orig: 'Baharat çarşısı hemen köşede.', en: 'The spice bazaar is just around the corner.' },
    { orig: 'Çay içmeden gitmeyelim.', en: 'Let’s not leave without having tea.' },
  ],
  rio: [
    { orig: 'Estamos na Lapa, ouçam a bateria ensaiando.', en: 'We’re in Lapa, listen to the drums rehearsing.' },
    { orig: 'Quem quer ver os arcos de perto?', en: 'Who wants to see the arches up close?' },
    { orig: 'A energia aqui é única.', en: 'The energy here is unique.' },
  ],
  kyoto: [
    { orig: '朝の祇園はとても静かです。', en: 'Gion is very quiet in the morning.' },
    { orig: '石畳の道をゆっくり歩きます。', en: 'We’ll walk slowly along the stone-paved road.' },
    { orig: 'お茶屋さんの前を通ります。', en: 'We’re passing in front of a tea house.' },
  ],
}

export const VIEWERS: { name: string; from: string }[] = [
  { name: 'Sara', from: 'Lagos' }, { name: 'Mateo', from: 'Bogotá' }, { name: 'Priya', from: 'Pune' },
  { name: 'Kenji', from: 'Osaka' }, { name: 'Lucas', from: 'Lyon' }, { name: 'Amina', from: 'Casablanca' },
  { name: 'Noah', from: 'Toronto' }, { name: 'Chloé', from: 'Geneva' }, { name: 'Omar', from: 'Cairo' },
  { name: 'Ivy', from: 'Sydney' }, { name: 'Diego', from: 'Lima' }, { name: 'Hana', from: 'Seoul' },
]

export const CHAT_POOL: string[] = [
  'This view is unreal', 'Can you slow down a little?', 'Greetings from here!', 'How cold is it right now?',
  'Vote for the first option', 'Second option please', 'I have always wanted to see this place', 'Can you show the street signs?',
  'The sound is great', 'Is that a market ahead?', 'Never thought I would see this today', 'What is that building on the left?',
  'Thank you for doing this', 'Come back to the last corner please', 'My kids are watching with me', 'Best way to spend a lunch break',
  'Can you ask someone what they recommend?', 'Wow, look at that light', 'Is it crowded today?', 'Hello from the other side of the world',
]

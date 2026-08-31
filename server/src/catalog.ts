// Single source of truth for pricing and catalog content.
// The client never sends an amount — it sends a slab id and the server looks up the price.

export type Slab = {
  id: string
  amount: number // rupees
  title: string
  tagline: string
  items: string[]
}

export const SLABS: Slab[] = [
  {
    id: '101',
    amount: 101,
    title: 'Boondi Prasad',
    tagline: 'A simple, heartfelt offering',
    items: ['Boondi Prasad', 'Mauli', 'Roli', 'Ganga Jal'],
  },
  {
    id: '251',
    amount: 251,
    title: 'Ladoo Prasad',
    tagline: 'The most chosen offering',
    items: ['Ladoo Prasad', 'Mauli', 'Roli', 'Ganga Jal'],
  },
  {
    id: '501',
    amount: 501,
    title: 'Ladoo Prasad with Diyas',
    tagline: 'For festive days at home',
    items: ['Ladoo Prasad', 'Mauli', 'Roli', 'Ganga Jal', 'Decorative Diyas'],
  },
  {
    id: '1100',
    amount: 1100,
    title: 'Maha Prasad',
    tagline: 'Our most complete chadawa',
    items: ['Maha Prasad', 'Mauli', 'Roli', 'Ganga Jal', 'German Silver Coin'],
  },
]

export type Deity = {
  id: string
  name: string
  epithet: string
  blessing: string
  keywords: string[]
}

// Placeholder names and imagery — swap in real photographs at public/deities/<id>.svg
export const DEITIES: Deity[] = [
  { id: 'ganesha', name: 'Shri Ganesha', epithet: 'Vighnaharta', blessing: 'Remover of obstacles, patron of new beginnings', keywords: ['ganpati', 'ganesh', 'vinayaka'] },
  { id: 'shiva', name: 'Bhagwan Shiva', epithet: 'Mahadev', blessing: 'Stillness, dissolution of ego, inner strength', keywords: ['mahadev', 'bholenath', 'shankar'] },
  { id: 'vishnu', name: 'Bhagwan Vishnu', epithet: 'Jagat Palak', blessing: 'Preservation, protection and steadiness of life', keywords: ['narayan', 'hari'] },
  { id: 'lakshmi', name: 'Maa Lakshmi', epithet: 'Dhan Daata', blessing: 'Abundance, prosperity and grace in the home', keywords: ['laxmi', 'shri'] },
  { id: 'durga', name: 'Maa Durga', epithet: 'Shakti Swaroopa', blessing: 'Courage and protection from all harm', keywords: ['sherawali', 'ambe', 'shakti'] },
  { id: 'hanuman', name: 'Shri Hanuman', epithet: 'Sankat Mochan', blessing: 'Strength, devotion and relief from distress', keywords: ['bajrangbali', 'maruti'] },
  { id: 'krishna', name: 'Bhagwan Krishna', epithet: 'Murlidhar', blessing: 'Joy, clarity of duty and divine love', keywords: ['kanha', 'gopal', 'shyam'] },
  { id: 'rama', name: 'Bhagwan Rama', epithet: 'Maryada Purushottam', blessing: 'Righteousness, patience and family harmony', keywords: ['ram', 'raghunath'] },
  { id: 'saraswati', name: 'Maa Saraswati', epithet: 'Vidya Daayini', blessing: 'Learning, music and clear speech', keywords: ['sarasvati', 'vidya'] },
  { id: 'kali', name: 'Maa Kali', epithet: 'Adi Shakti', blessing: 'Fearlessness and the end of negativity', keywords: ['kalika', 'shakti'] },
  { id: 'sai-baba', name: 'Sai Baba', epithet: 'Shirdi ke Sai', blessing: 'Faith, patience and quiet assurance', keywords: ['shirdi', 'sai'] },
  { id: 'santoshi-mata', name: 'Maa Santoshi', epithet: 'Santosh Daayini', blessing: 'Contentment and the fulfilment of vows', keywords: ['santoshi', 'shukrawar'] },
]

export type PujaEvent = {
  id: string
  name: string
  date: string // ISO date of the puja
  deityId: string
  description: string
}

// Placeholder festival calendar — dates to be confirmed against the panchang each year.
export const EVENTS: PujaEvent[] = [
  { id: 'ganesh-chaturthi', name: 'Ganesh Chaturthi', date: '2026-09-14', deityId: 'ganesha', description: 'The birth of Shri Ganesha. Prasad is offered at the morning aarti and modak is placed at his feet before dispatch.' },
  { id: 'navratri', name: 'Sharad Navratri — Ashtami', date: '2026-10-18', deityId: 'durga', description: 'Ashtami puja of the nine nights. Chadawa is offered to Maa Durga with the kalash and akhand jyot.' },
  { id: 'karva-chauth', name: 'Karva Chauth', date: '2026-10-29', deityId: 'santoshi-mata', description: 'Vrat katha and moonrise puja. Prasad is offered after the fast is broken and dispatched the next morning.' },
  { id: 'diwali', name: 'Diwali — Lakshmi Puja', date: '2026-11-08', deityId: 'lakshmi', description: 'Lakshmi-Ganesh puja on the night of Amavasya, with diyas lit in your name and gotra.' },
  { id: 'maha-shivratri', name: 'Maha Shivratri', date: '2027-02-15', deityId: 'shiva', description: 'Night-long jalabhishek of the Shivling. Bel patra and Ganga jal are offered on your behalf.' },
  { id: 'janmashtami', name: 'Krishna Janmashtami', date: '2026-09-04', deityId: 'krishna', description: 'Midnight abhishek of Bal Gopal, with panjiri and makhan-mishri offered in your name.' },
]

export function findSlab(id: string) {
  return SLABS.find((s) => s.id === id)
}

export function findDeity(id: string) {
  return DEITIES.find((d) => d.id === id)
}

export function findEvent(id: string) {
  return EVENTS.find((e) => e.id === id)
}

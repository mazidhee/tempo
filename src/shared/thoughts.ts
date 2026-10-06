export interface Thought {
  id: string;
  text: string;
  author: string;
  prompt: string;
  active: boolean;
  source?: string;
}
export interface DailyThought extends Omit<Thought, 'active'> { date: string }
export interface ThoughtLibrary { entries: Thought[]; days: DailyThought[] }
// Original paraphrases, not quotations. Attribution identifies the source idea.
const source = 'https://www.gutenberg.org/ebooks/45109';
const seeds = [
  ['I', 'Give your attention to the choices that are yours to make.', 'What was within my control today?'],
  ['IV', 'Prepare for interruptions without giving up the way you want to act.', 'How did I respond to an interruption?'],
  ['V', 'Before reacting, examine the judgment you have added to an event.', 'Which judgment could I reconsider?'],
  ['VI', 'Let your own conduct matter more than the things you possess.', 'What action am I proud of?'],
  ['VIII', 'Meet the day as it unfolds, then choose your response with care.', 'Where did acceptance help today?'],
  ['X', 'Ask what quality this difficulty gives you a chance to practise.', 'What quality did I practise today?'],
  ['XII', 'Practise steadiness with small inconveniences before the larger ones arrive.', 'What small frustration became practice?'],
  ['XIII', 'Protect your character before your reputation for knowing everything.', 'When did I choose honesty over appearances?'],
];
export const defaultThoughtLibrary = (): ThoughtLibrary => ({
  entries: seeds.map(([section, text, prompt]) => ({
    id: `stoic-epictetus-${section}`, text, prompt, active: true,
    author: `Inspired by Epictetus · Enchiridion, ${section}`, source,
  })), days: [],
});
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86400000;
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(dayNumber(v)) && new Date(dayNumber(v) * 86400000).toISOString().slice(0, 10) === v;
export function validThoughtLibrary(value: unknown): value is ThoughtLibrary {
  if (!value || typeof value !== 'object') return false;
  const library = value as ThoughtLibrary;
  const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
  const thought = (v: Thought | DailyThought) => !!v && text(v.id, 120) && !!v.id && text(v.text, 2000) &&
    !!v.text.trim() && text(v.author, 200) && text(v.prompt, 500) &&
    (v.source === undefined || (text(v.source, 500) && /^https:\/\//.test(v.source)));
  return Array.isArray(library.entries) && library.entries.length <= 1000 &&
    library.entries.every((v) => thought(v) && typeof v.active === 'boolean') &&
    new Set(library.entries.map(v => v.id)).size === library.entries.length &&
    Array.isArray(library.days) && library.days.length <= 50000 &&
    library.days.every((v) => thought(v) && isDay(v.date)) &&
    new Set(library.days.map(v => v.date)).size === library.days.length;
}
export function selectDailyThought(library: ThoughtLibrary, date: string): ThoughtLibrary {
  if (!isDay(date) || library.days.some(v => v.date === date)) return library;
  const active = library.entries.filter(v => v.active);
  if (!active.length) return library;
  // Calendar ordinals, never elapsed local milliseconds: DST does not repeat a day.
  const selected = active[((dayNumber(date) % active.length) + active.length) % active.length];
  const { active: _active, ...snapshot } = selected;
  return { ...library, days: [...library.days, { ...snapshot, date }] };
}
export function mergeThoughtLibraries(current?: ThoughtLibrary, incoming?: ThoughtLibrary): ThoughtLibrary | undefined {
  if (!incoming) return current;
  if (!current) return incoming;
  return {
    entries: [...current.entries, ...incoming.entries.filter(v => !current.entries.some(e => e.id === v.id))],
    days: [...current.days, ...incoming.days.filter(v => !current.days.some(e => e.date === v.date))],
  };
}

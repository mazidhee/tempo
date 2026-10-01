export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';
export interface Greeting {
  title: string;
  detail: string;
}
export const dayPart = (hour: number): DayPart =>
  hour < 5
    ? 'night'
    : hour < 12
      ? 'morning'
      : hour < 17
        ? 'afternoon'
        : hour < 21
          ? 'evening'
          : 'night';
const friendly = [
  ['Small steps count', 'Pick one thing worth your attention.'],
  ['Make a little room for progress', 'You can start small and still move forward.'],
  ['Your next chapter is waiting', 'A topic, a timer, and a little curiosity.'],
  ['One good thing at a time', 'Today does not need to be a perfect day.'],
  ['Welcome back to your corner', 'Your plans and progress are right here.'],
  ['A little curiosity goes a long way', 'Follow the question that interests you.'],
  ['You have a place to begin', 'Choose your next small step.'],
  ['Let’s make something click', 'Understanding grows with patient practice.'],
  ['A fresh page, familiar tools', 'Start with what matters to you.'],
  ['Put your attention somewhere good', 'A short session is still a session.'],
  ['Ready when you are', 'There is no prize for rushing the first step.'],
  ['Find a rhythm that fits', 'Your workspace can move at your pace.'],
  ['A small win is still a win', 'Leave room to notice what went well.'],
  ['Bring your questions', 'They are useful tools for learning.'],
  ['Give one thing a fair chance', 'A little undivided attention can help.'],
  ['Progress has many speeds', 'Consistency includes adjusting the pace.'],
  ['Begin wherever you are', 'You do not need a perfect setup to start.'],
  ['Keep the next step simple', 'A clear task beats a complicated promise.'],
  ['There is room to try again', 'Yesterday does not have the final word.'],
  ['Today can be ordinary and useful', 'Small, steady work adds up.'],
  ['Make space for the difficult bit', 'It is okay if understanding takes a few attempts.'],
  ['You are allowed to change the plan', 'A useful plan responds to real life.'],
  ['Let curiosity take a turn', 'Try asking why before checking the box.'],
  ['A quieter kind of momentum', 'One focused interval can be enough to begin.'],
  ['Keep a little energy for yourself', 'Breaks are part of a sustainable rhythm.'],
  ['Your future self says hello', 'Leave them a clear note about what you learned.'],
  ['The next step can be tiny', 'Tiny is a perfectly respectable starting size.'],
  ['Come as you are', 'The workspace is ready; you can set the pace.'],
  ['Something worth learning awaits', 'Find the next question in your curriculum.'],
  ['Let’s give today some shape', 'Choose a priority and make room for a break.'],
];
const playful = [
  ['Your to-do list called', 'Apparently, it believes in you.'],
  ['No meetings with your distractions yet', 'They can wait while you choose a first step.'],
  ['The blank checkbox is being dramatic', 'A small action usually settles it down.'],
  ['Today’s special: one manageable task', 'No reservation required.'],
  ['Your tabs have formed a committee', 'You are still allowed to focus on just one.'],
  ['Attention is back in the building', 'Please give it somewhere comfortable to sit.'],
  ['Your keyboard looks optimistic', 'Let’s see what one little session can do.'],
  ['The timer is not judging you', 'It is mostly concerned with seconds.'],
  ['A plot twist: starting small works', 'The big dramatic beginning is optional.'],
  ['Your checklist has main-character energy', 'You still get to choose the story.'],
];
const languages = [
  ['Bonjour', 'French for hello. Your daily workspace is ready.'],
  ['Hola', 'Spanish for hello. Start with one useful thing.'],
  ['Ciao', 'Italian for hello. Make a little room for yourself.'],
  ['Olá', 'Portuguese for hello. A fresh visit, a familiar workspace.'],
  ['Hallo', 'German for hello. Choose your next small step.'],
];
const periods: Record<DayPart, string[][]> = {
  morning: [
    ['Good morning', 'Your daily workspace.'],
    ['Rise at your own pace', 'Pick a gentle starting point.'],
    ['A new morning, a new opening', 'You can choose what deserves your attention.'],
    ['Morning, a little possibility', 'One clear priority can set the tone.'],
    ['Hello to a fresh start', 'Leave some breathing room in the plan.'],
  ],
  afternoon: [
    ['Good afternoon', 'Your daily workspace.'],
    ['A useful little reset', 'The next part of the day can start here.'],
    ['There is still room in today', 'Choose a task that fits the energy you have.'],
    ['Take the afternoon one thing at a time', 'A small focused session can help.'],
    ['A pause, then a next step', 'Check what matters before carrying on.'],
  ],
  evening: [
    ['Good evening', 'Your daily workspace.'],
    ['Welcome to the quieter hours', 'Reflect, learn a little, or wind down.'],
    ['Make room for a small reflection', 'What went well today?'],
    ['The day has a few stories', 'Save one thought worth remembering.'],
    ['An evening at your own pace', 'You can finish gently.'],
  ],
  night: [
    ['Good night', 'Rest belongs in the plan too.'],
    ['The quiet hours are here', 'Keep the next step gentle.'],
    ['Leave tomorrow a little note', 'Then give yourself permission to rest.'],
    ['Your workspace can wait', 'Sleep is useful preparation, too.'],
    ['A softer ending to the day', 'Notice a small win before you sign off.'],
  ],
};
export function greetingFor(
  hour: number,
  name: string,
  seed = Math.random(),
  simple = false,
): Greeting {
  const slot = dayPart(hour);
  const options = simple
    ? [periods[slot][0]]
    : slot === 'night'
      ? periods.night
      : [...periods[slot], ...friendly, ...playful, ...languages];
  const [title, detail] =
    options[Math.min(options.length - 1, Math.max(0, Math.floor(seed * options.length)))];
  const personal = name.trim() ? `${title}, ${name.trim()}` : title;
  return { title: personal + '.', detail };
}

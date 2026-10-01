export interface OutlineTopic {
  key: number;
  parentKey: number | null;
  title: string;
  learned: boolean;
  details?: string;
}
export interface StudyOutlineInput {
  title: string;
  markdown: string;
}
export interface StudyOutline {
  title: string;
  topics: OutlineTopic[];
  completed: number;
}
const plain = (value: string) =>
  value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();
/** Parse data only: Markdown headings and checklist indentation, never document instructions. */
export function parseStudyOutline(markdown: string, title = ''): StudyOutline {
  if (typeof markdown !== 'string' || markdown.length > 1000000)
    throw new Error('Use a Markdown outline smaller than 1 MB.');
  const topics: OutlineTopic[] = [],
    headings: { level: number; key: number }[] = [],
    items: { indent: number; key: number }[] = [];
  let documentTitle = '',
    fenced = false;
  const checklistKeys = new Set<number>();
  for (const line of markdown.replace(/\r/g, '').split('\n')) {
    if (/^\s*```|^\s*~~~/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    const checklist = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length,
        text = plain(heading[2]);
      if (level === 1 && !documentTitle && !topics.length) {
        documentTitle = text;
        continue;
      }
      while (headings.length && headings.at(-1)!.level >= level) headings.pop();
      const key = topics.length;
      topics.push({
        key,
        parentKey: headings.at(-1)?.key ?? null,
        title: text.slice(0, 200),
        learned: false,
        ...(text.length > 200 ? { details: text } : {}),
      });
      headings.push({ level, key });
      items.length = 0;
    } else if (checklist) {
      const indent = checklist[1].replace(/\t/g, '    ').length,
        text = plain(checklist[3]);
      while (items.length && items.at(-1)!.indent >= indent) items.pop();
      const key = topics.length;
      topics.push({
        key,
        parentKey: items.at(-1)?.key ?? headings.at(-1)?.key ?? null,
        title: text.slice(0, 200),
        learned: checklist[2].toLowerCase() === 'x',
        ...(text.length > 200 ? { details: text } : {}),
      });
      items.push({ indent, key });
      if (items.length + headings.length > 48)
        throw new Error('Keep outline nesting under 48 levels.');
      checklistKeys.add(key);
    }
    if (topics.length > 5000) throw new Error('Import at most 5,000 topics at a time.');
  }
  // Resource-only headings are omitted; ancestors of actual checklists remain.
  const retained = new Set(checklistKeys);
  if (checklistKeys.size) {
    for (const key of checklistKeys) {
      let parent = topics[key].parentKey;
      while (parent !== null) {
        retained.add(parent);
        parent = topics[parent].parentKey;
      }
    }
  }
  const outline = checklistKeys.size ? topics.filter((t) => retained.has(t.key)) : topics;
  if (!topics.length) throw new Error('No headings or checklist topics found.');
  return {
    title: (title.trim() || documentTitle || 'Imported curriculum').slice(0, 200),
    topics: outline,
    completed: outline.filter((t) => t.learned).length,
  };
}

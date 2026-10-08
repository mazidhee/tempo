import { validateJournalDocument, type JournalDocument } from './journalDocument';
import type { StudySnapshot } from './study';
import type { Productivity } from './productivity';
export interface KnowledgeNote {
  id: string;
  title: string;
  folder: string;
  tags: string[];
  document: JournalDocument;
  links: string[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}
export interface KnowledgeSnapshot {
  notes: KnowledgeNote[];
  folders: string[];
  directory: string;
  error: string;
}
export interface GraphNode {
  id: string;
  label: string;
  kind: 'note' | 'topic' | 'curriculum' | 'project';
  route: string;
}
export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: { source: string; target: string; kind: 'contains' | 'references' }[];
}
export function validFolder(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 300 &&
    (value === '' ||
      value
        .split('/')
        .every(
          (segment) =>
            segment.length > 0 &&
            segment.length <= 80 &&
            segment === segment.trim() &&
            !/[<>:"\\|?*\x00-\x1f]/.test(segment) &&
            !/[. ]$/.test(segment) &&
            segment !== '.' &&
            segment !== '..' &&
            !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment),
        ))
  );
}
export function validateNote(value: unknown): asserts value is KnowledgeNote {
  const n = value as KnowledgeNote;
  if (
    !n ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(n.id) ||
    typeof n.title !== 'string' ||
    !n.title.trim() ||
    n.title.length > 200 ||
    !validFolder(n.folder) ||
    !Array.isArray(n.tags) ||
    n.tags.length > 30 ||
    n.tags.some((t) => typeof t !== 'string' || t.length > 80) ||
    !Array.isArray(n.links) ||
    n.links.length > 1000 ||
    n.links.some(
      (l) =>
        typeof l !== 'string' || !/^(note|topic|curriculum|project):[a-zA-Z0-9_-]{1,100}$/.test(l),
    ) ||
    typeof n.archived !== 'boolean' ||
    !Number.isFinite(Date.parse(n.createdAt)) ||
    !Number.isFinite(Date.parse(n.updatedAt))
  )
    throw Error('Invalid note. Check its title, folder and links.');
  validateJournalDocument(n.document);
}
/** Markdown is a portable mirror of the supported semantic blocks; no executable HTML. */
export function documentMarkdown(doc: JournalDocument): string {
  const write = (n: JournalDocument, raw = false): string => {
    if (n.type === 'text') {
      const source = n.text || '';
      let text = raw ? source : source.replace(/([\\`*_[\]<>])/g, '\\$1');
      if (raw) return text;
      for (const m of n.marks || []) {
        if (m.type === 'bold') text = `**${text}**`;
        if (m.type === 'italic') text = `*${text}*`;
        if (m.type === 'strike') text = `~~${text}~~`;
        if (m.type === 'code') {
          const fence = '`'.repeat(
            Math.max(1, ...(source.match(/`+/g) || []).map((x) => x.length + 1)),
          );
          text = `${fence}${/^[` ]|[` ]$/.test(source) ? ' ' : ''}${source}${/^[` ]|[` ]$/.test(source) ? ' ' : ''}${fence}`;
        }
      }
      return text;
    }
    if (n.type === 'codeBlock') {
      const body = (n.content || []).map((c) => write(c, true)).join('');
      const fence = '`'.repeat(Math.max(3, ...(body.match(/`+/g) || []).map((x) => x.length + 1)));
      return `${fence}${n.attrs?.language || ''}\n${body}\n${fence}\n\n`;
    }
    const content = (n.content || []).map((c) => write(c, raw)).join('');
    if (n.type === 'paragraph') return content + '\n\n';
    if (n.type === 'heading')
      return '#'.repeat(Number(n.attrs?.level) || 2) + ' ' + content + '\n\n';
    if (n.type === 'bulletList' || n.type === 'orderedList')
      return (
        (n.content || [])
          .map((c, i) => {
            const prefix = n.type === 'bulletList' ? '- ' : `${Number(n.attrs?.start || 1) + i}. `;
            return (
              prefix +
              write(c)
                .trim()
                .replace(/\n/g, '\n' + ' '.repeat(prefix.length))
            );
          })
          .join('\n') + '\n\n'
      );
    if (n.type === 'blockquote')
      return (
        content
          .trim()
          .split('\n')
          .map((x) => '> ' + x)
          .join('\n') + '\n\n'
      );
    if (n.type === 'horizontalRule') return '---\n\n';
    if (n.type === 'hardBreak') return '  \n';
    return content;
  };
  return write(doc).trim();
}
export function noteMarkdown(n: KnowledgeNote) {
  return `---\nid: ${JSON.stringify(n.id)}\ntitle: ${JSON.stringify(n.title)}\nfolder: ${JSON.stringify(n.folder)}\ntags: ${JSON.stringify(n.tags)}\nlinks: ${JSON.stringify(n.links)}\ncreated: ${JSON.stringify(n.createdAt)}\nupdated: ${JSON.stringify(n.updatedAt)}\narchived: ${n.archived}\n---\n\n# ${n.title.replace(/\n/g, ' ')}\n\n${documentMarkdown(n.document)}\n`;
}
export function buildKnowledgeGraph(
  notes: KnowledgeNote[],
  study: StudySnapshot,
  productivity: Productivity,
): KnowledgeGraph {
  const nodes: GraphNode[] = [],
    edges: KnowledgeGraph['edges'] = [];
  for (const n of notes.filter((n) => !n.archived))
    nodes.push({ id: `note:${n.id}`, label: n.title, kind: 'note', route: `/notes/${n.id}` });
  for (const c of study.curricula.filter((c) => !c.archived))
    nodes.push({
      id: `curriculum:${c.id}`,
      label: c.title,
      kind: 'curriculum',
      route: `/study/${c.id}`,
    });
  for (const t of study.topics.filter((t) => !t.archived)) {
    nodes.push({
      id: `topic:${t.id}`,
      label: t.title,
      kind: 'topic',
      route: `/study/${t.curriculumId}?topic=${encodeURIComponent(t.id)}`,
    });
    edges.push({
      source: t.parentId ? `topic:${t.parentId}` : `curriculum:${t.curriculumId}`,
      target: `topic:${t.id}`,
      kind: 'contains',
    });
  }
  for (const p of (productivity.settings.workProjects || []).filter((p) => !p.archived))
    nodes.push({
      id: `project:${p.id}`,
      label: p.title,
      kind: 'project',
      route: `/work?project=${encodeURIComponent(p.id)}`,
    });
  for (const n of notes.filter((n) => !n.archived))
    for (const target of n.links)
      edges.push({ source: `note:${n.id}`, target, kind: 'references' });
  const ids = new Set(nodes.map((n) => n.id)),
    unique = new Set<string>();
  return {
    nodes,
    edges: edges.filter((e) => {
      const key = `${e.source}\0${e.target}`;
      if (!ids.has(e.source) || !ids.has(e.target) || e.source === e.target || unique.has(key))
        return false;
      unique.add(key);
      return true;
    }),
  };
}
declare module './workspace' {
  interface WorkspaceRequests {
    'notes:snapshot': { input: undefined; output: KnowledgeSnapshot };
    'notes:save': { input: KnowledgeNote; output: KnowledgeSnapshot };
    'notes:folder': { input: string; output: KnowledgeSnapshot };
    'notes:graph': { input: undefined; output: KnowledgeGraph };
  }
  interface WorkspaceEvents {
    'notes:changed': KnowledgeSnapshot;
  }
}

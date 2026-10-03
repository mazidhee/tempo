export interface JournalDocument {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
  content?: JournalDocument[];
}
export function plainJournalDocument(text: string): JournalDocument {
  return {
    type: 'doc',
    content: text
      .split('\n')
      .map((line) => ({
        type: 'paragraph',
        ...(line ? { content: [{ type: 'text', text: line }] } : {}),
      })),
  };
}
/** Semantic editor JSON only: reject HTML, images, URLs and arbitrary attributes. */
export function validateJournalDocument(value: unknown): asserts value is JournalDocument {
  if (!value || typeof value !== 'object' || JSON.stringify(value).length > 1000000)
    throw new Error('Journal document is too large or invalid.');
  let count = 0;
  const nodes = new Set([
    'doc',
    'paragraph',
    'text',
    'heading',
    'bulletList',
    'orderedList',
    'listItem',
    'blockquote',
    'codeBlock',
    'hardBreak',
    'horizontalRule',
  ]);
  const visit = (node: unknown, depth: number) => {
    const n = node as JournalDocument;
    if (!n || typeof n !== 'object' || !nodes.has(n.type) || depth > 30 || ++count > 20000)
      throw new Error('Unsupported journal content.');
    if (n.type === 'text' && (typeof n.text !== 'string' || n.text.length > 200000))
      throw new Error('Invalid journal text.');
    if (n.text !== undefined && n.type !== 'text') throw new Error('Invalid journal text node.');
    if (n.attrs) {
      const keys = Object.keys(n.attrs),
        allowed =
          n.type === 'heading'
            ? ['level']
            : n.type === 'orderedList'
              ? ['start', 'type']
              : n.type === 'codeBlock'
                ? ['language']
                : [];
      if (keys.some((key) => !allowed.includes(key)))
        throw new Error('Unsupported journal attributes.');
      if (n.type === 'heading' && ![1, 2, 3].includes(Number(n.attrs.level)))
        throw new Error('Invalid heading.');
      if (
        n.type === 'orderedList' &&
        n.attrs.start !== undefined &&
        (!Number.isInteger(n.attrs.start) ||
          Number(n.attrs.start) < 1 ||
          Number(n.attrs.start) > 100000)
      )
        throw new Error('Invalid list.');
      if (
        n.type === 'codeBlock' &&
        n.attrs.language !== null &&
        n.attrs.language !== undefined &&
        (typeof n.attrs.language !== 'string' || n.attrs.language.length > 50)
      )
        throw new Error('Invalid code language.');
    }
    if (
      n.marks &&
      (!Array.isArray(n.marks) ||
        n.marks.some(
          (m) =>
            !['bold', 'italic', 'strike', 'code', 'underline'].includes(m.type) ||
            Object.keys(m).some((k) => k !== 'type'),
        ))
    )
      throw new Error('Unsupported journal formatting.');
    if (n.content) {
      if (!Array.isArray(n.content)) throw new Error('Invalid journal content.');
      n.content.forEach((child) => visit(child, depth + 1));
    }
  };
  if ((value as JournalDocument).type !== 'doc') throw new Error('Invalid journal document.');
  visit(value, 0);
}
export function journalDocumentText(doc: JournalDocument): string {
  if (doc.type === 'text') return doc.text || '';
  if (doc.type === 'hardBreak') return '\n';
  return (doc.content || [])
    .map(journalDocumentText)
    .join(
      ['doc', 'bulletList', 'orderedList', 'listItem', 'blockquote'].includes(doc.type) ? '\n' : '',
    );
}

import { Fragment } from 'react';
import { Download } from 'lucide-react';
import guide from '../../../docs/user-guide.md?raw';
import { download } from './ui';
const slug = (text: string) => 'guide-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
        if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        return <Fragment key={index}>{link ? link[1] : part}</Fragment>;
      })}
    </>
  );
}
/** A deliberately restricted Markdown reader: text, lists, headings and tables; no raw HTML. */
export default function UserGuide() {
  const sections = guide
    .split('\n')
    .filter((line) => /^## /.test(line))
    .map((line) => line.slice(3).trim());
  return (
    <section className="panel user-guide">
      <div className="section-heading">
        <div>
          <h2>Getting started with Tempo</h2>
          <p className="muted">Read this guide offline, or keep the Markdown file.</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => download('tempo-user-guide.md', guide, 'text/markdown')}
        >
          <Download />
          Download .md
        </button>
      </div>
      <nav className="guide-contents" aria-label="Guide contents">
        {sections.map((title) => (
          <a
            href={'#' + slug(title)}
            key={title}
            onClick={(event) => {
              event.preventDefault();
              document
                .getElementById(slug(title))
                ?.scrollIntoView({
                  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'instant'
                    : 'smooth',
                  block: 'start',
                });
            }}
          >
            {title}
          </a>
        ))}
      </nav>
      <article>
        {guide.split(/\n\s*\n/).map((block, index) => {
          const text = block.trim(),
            heading = /^(#{1,4})\s+(.+)$/.exec(text);
          if (!text || text.startsWith('<!--')) return null;
          if (heading)
            return heading[1].length < 3 ? (
              <h3 id={slug(heading[2])} key={index}>
                {heading[2]}
              </h3>
            ) : (
              <h4 id={slug(heading[2])} key={index}>
                {heading[2]}
              </h4>
            );
          const lines = text.split('\n');
          if (lines.every((line) => /^[-*] /.test(line)))
            return (
              <ul key={index}>
                {lines.map((line, i) => (
                  <li key={i}>
                    <Inline text={line.slice(2)} />
                  </li>
                ))}
              </ul>
            );
          if (lines.every((line) => /^\d+\. /.test(line)))
            return (
              <ol key={index}>
                {lines.map((line, i) => (
                  <li key={i}>
                    <Inline text={line.replace(/^\d+\. /, '')} />
                  </li>
                ))}
              </ol>
            );
          if (text.startsWith('|')) {
            const rows = lines
              .filter((line) => !/^\|[\s:|-]+\|$/.test(line))
              .map((line) =>
                line
                  .split('|')
                  .slice(1, -1)
                  .map((cell) => cell.trim()),
              );
            return (
              <div className="table-scroll" key={index}>
                <table className="stats-table">
                  <thead>
                    <tr>
                      {rows[0].map((cell, i) => (
                        <th scope="col" key={i}>
                          <Inline text={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(1).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          return (
            <p key={index}>
              <Inline text={lines.join(' ')} />
            </p>
          );
        })}
      </article>
    </section>
  );
}

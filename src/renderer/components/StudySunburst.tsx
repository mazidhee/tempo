import { useMemo, useState } from 'react';
import { studyTimeTree, timeSlices, formatStudyTime, type TimeNode } from '../../shared/time';
import type { StudySnapshot } from '../../shared/study';
import type { Session } from '../../shared/productivity';
const point = (r: number, angle: number) => [180 + r * Math.sin(angle), 180 - r * Math.cos(angle)];
function arc(inner: number, outer: number, start: number, end: number) {
  // Split arcs so a 360-degree slice renders correctly without a special case.
  const middle = (start + end) / 2;
  const [a, b, c, d, e, f] = [
    point(outer, start),
    point(outer, middle),
    point(outer, end),
    point(inner, end),
    point(inner, middle),
    point(inner, start),
  ];
  return `M${a} A${outer},${outer} 0 0 1 ${b} A${outer},${outer} 0 0 1 ${c} L${d} A${inner},${inner} 0 0 0 ${e} A${inner},${inner} 0 0 0 ${f} Z`;
}
export default function StudySunburst({
  study,
  sessions,
}: {
  study: StudySnapshot;
  sessions: Session[];
}) {
  const tree = useMemo(() => studyTimeTree(study, sessions), [study, sessions]);
  const [path, setPath] = useState<string[]>([]),
    [hovered, setHovered] = useState<TimeNode | null>(null);
  let root = tree;
  const breadcrumbs = [tree];
  for (const id of path) {
    const child = root.children.find((n) => n.id === id);
    if (!child) break;
    root = child;
    breadcrumbs.push(child);
  }
  const slices = timeSlices(root),
    active = hovered ?? root;
  const drill = (node: TimeNode) => {
    if (!node.children.length) return;
    const find = (parent: TimeNode, ids: string[]): string[] | null => {
      if (parent.id === node.id) return ids;
      for (const child of parent.children) {
        const result = find(child, [...ids, child.id]);
        if (result) return result;
      }
      return null;
    };
    setPath(find(tree, []) ?? []);
    setHovered(null);
  };
  return (
    <section className="panel sunburst-panel">
      <div className="section-heading">
        <div>
          <h2>Study time by topic</h2>
          <p className="muted">
            Inner rings are curricula; outer rings are their topics. Select a slice to explore.
          </p>
        </div>
      </div>
      <nav className="sunburst-breadcrumbs" aria-label="Study time hierarchy">
        {breadcrumbs.map((node, index) => (
          <button
            className="btn-ghost"
            key={node.id}
            onClick={() => {
              setPath(path.slice(0, index));
              setHovered(null);
            }}
          >
            {node.name}
          </button>
        ))}
      </nav>
      {tree.seconds ? (
        <div className="sunburst-layout">
          <svg
            viewBox="0 0 360 360"
            className="study-sunburst"
            role="group"
            aria-label="Sunburst of recorded study time"
          >
            {slices.map((slice) => (
              <path
                key={slice.node.id}
                d={arc(
                  50 + (slice.depth - 1) * 38,
                  86 + (slice.depth - 1) * 38,
                  slice.start,
                  slice.end,
                )}
                fill={['var(--primary)', 'var(--heat-3)', 'var(--heat-2)'][slice.depth - 1]}
                stroke="var(--surface-1)"
                strokeWidth={2}
                tabIndex={0}
                role="button"
                aria-label={`${slice.node.name}: ${formatStudyTime(slice.node.seconds)}`}
                onMouseEnter={() => setHovered(slice.node)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(slice.node)}
                onBlur={() => setHovered(null)}
                onClick={() => drill(slice.node)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    drill(slice.node);
                  }
                }}
              >
                <title>
                  {slice.node.name}: {formatStudyTime(slice.node.seconds)}
                </title>
              </path>
            ))}
            <text x={180} y={176} textAnchor="middle" className="sunburst-total">
              {formatStudyTime(root.seconds)}
            </text>
            <text x={180} y={199} textAnchor="middle" className="sunburst-caption">
              recorded
            </text>
          </svg>
          <div className="sunburst-detail" aria-live="polite">
            <h3>{active.name}</h3>
            <p>{formatStudyTime(active.seconds)}</p>
            <p className="muted">
              {Math.round((active.seconds / tree.seconds) * 100)}% of study time in this range
            </p>
            {root.children.map((child) => (
              <button
                className="sunburst-list-item"
                key={child.id}
                onClick={() => (child.children.length ? drill(child) : setHovered(child))}
              >
                <span>{child.name}</span>
                <strong>{formatStudyTime(child.seconds)}</strong>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="muted inline-empty">
          Track time on a Study topic or add a linked session to build your time map.
        </p>
      )}
    </section>
  );
}

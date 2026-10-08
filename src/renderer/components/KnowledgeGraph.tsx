import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Plus, Minus, Maximize2, ArrowUpRight } from 'lucide-react';
import type { KnowledgeGraph as Graph, GraphNode } from '../../shared/knowledge';
import { createGraphLayout } from '../../shared/graphLayout';
import '../styles/knowledge-graph.css';
export function KnowledgeGraph({ onClose }: { onClose: () => void }) {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] }),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState<string | null>(null),
    [kind, setKind] = useState('all'),
    [zoom, setZoom] = useState(1),
    [wide, setWide] = useState(false);
  const graphSignature = useRef('');
  const canvas = useRef<HTMLCanvasElement>(null),
    layout = useRef<ReturnType<typeof createGraphLayout> | null>(null),
    offset = useRef({ x: 0, y: 0 }),
    drawing = useRef(() => {}),
    navigate = useNavigate();
  useEffect(() => {
    let alive = true;
    let scheduled: ReturnType<typeof setTimeout>;
    const load = () => {
      clearTimeout(scheduled);
      scheduled = setTimeout(
        () =>
          void window.workspaceAPI
            .invoke('notes:graph')
            .then((g) => {
              if (alive) {
                const signature = JSON.stringify(g);
                if (signature !== graphSignature.current) {
                  graphSignature.current = signature;
                  setGraph(g);
                }
                setError('');
              }
            })
            .catch((e) => {
              if (alive) setError(e.message);
            }),
        180,
      );
    };
    load();
    const off = [
      window.workspaceAPI.on('notes:changed', load),
      window.workspaceAPI.on('study:changed', load),
      window.workspaceAPI.on('focus:changed', load),
    ];
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', close);
    return () => {
      alive = false;
      clearTimeout(scheduled);
      off.forEach((f) => f());
      window.removeEventListener('keydown', close);
    };
  }, [onClose]);
  useEffect(() => {
    const filtered = {
      nodes: graph.nodes.filter((n) => kind === 'all' || n.kind === kind),
      edges: graph.edges,
    };
    const ids = new Set(filtered.nodes.map((n) => n.id));
    filtered.edges = filtered.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    layout.current = createGraphLayout(filtered);
    offset.current = { x: 0, y: 0 };
    setZoom(1);
  }, [graph, kind]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext('2d');
    if (!context) return;
    let frame = 0;
    const draw = () => {
      const model = layout.current;
      if (!model) return;
      const width = element.clientWidth,
        height = element.clientHeight,
        dpr = window.devicePixelRatio || 1;
      element.width = width * dpr;
      element.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const styles = getComputedStyle(element),
        scale = (Math.min(width, height) / (model.radius * 2.4)) * zoom,
        byId = new Map(model.points.map((p) => [p.id, p])),
        neighbors = new Set(
          graph.edges
            .filter((e) => e.source === selected || e.target === selected)
            .flatMap((e) => [e.source, e.target]),
        );
      context.translate(width / 2 + offset.current.x, height / 2 + offset.current.y);
      context.scale(scale, scale);
      context.lineWidth = 0.7 / scale;
      for (const edge of graph.edges) {
        const a = byId.get(edge.source),
          b = byId.get(edge.target);
        if (!a || !b) continue;
        context.globalAlpha =
          !selected || (neighbors.has(edge.source) && neighbors.has(edge.target)) ? 0.4 : 0.08;
        context.strokeStyle = styles.getPropertyValue('--ink-subtle');
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
      const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
      for (const p of model.points) {
        const node = nodeMap.get(p.id)!;
        context.globalAlpha = selected && !neighbors.has(p.id) && p.id !== selected ? 0.3 : 1;
        context.fillStyle = styles.getPropertyValue(
          node.kind === 'note'
            ? '--primary'
            : node.kind === 'project'
              ? '--warning'
              : '--ink-subtle',
        );
        context.beginPath();
        context.arc(
          p.x,
          p.y,
          (p.id === selected ? 5 : node.kind === 'curriculum' ? 3.5 : 2) / Math.sqrt(scale),
          0,
          Math.PI * 2,
        );
        context.fill();
        if (p.id === selected) {
          context.globalAlpha = 1;
          context.font = `${12 / scale}px sans-serif`;
          context.fillStyle = styles.getPropertyValue('--ink');
          context.fillText(node.label.slice(0, 45), p.x + 8 / scale, p.y - 8 / scale);
        }
      }
      context.globalAlpha = 1;
    };
    drawing.current = draw;
    const animate = () => {
      const more = layout.current?.step();
      draw();
      if (more) frame = requestAnimationFrame(animate);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      while (layout.current?.step()) {}
      draw();
    } else frame = requestAnimationFrame(animate);
    const resize = new ResizeObserver(draw);
    resize.observe(element);
    const theme = new MutationObserver(draw);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      theme.disconnect();
    };
  }, [graph, kind, selected, zoom, wide]);
  const node = graph.nodes.find((n) => n.id === selected),
    matches = graph.nodes
      .filter(
        (n) =>
          (kind === 'all' || n.kind === kind) &&
          n.label.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 30);
  const open = (n: GraphNode) => {
    navigate(n.route);
  };
  return (
    <aside className={`knowledge-graph-panel ${wide ? 'wide' : ''}`} aria-label="Knowledge graph">
      <header>
        <h2>Graph</h2>
        <button
          className="icon-button"
          aria-label="Expand graph panel"
          aria-pressed={wide}
          onClick={() => setWide(!wide)}
        >
          <Maximize2 />
        </button>
        <button className="icon-button" aria-label="Close graph panel" onClick={onClose}>
          <X />
        </button>
      </header>
      <label className="graph-search">
        <Search />
        <input
          aria-label="Search graph records"
          placeholder="Find a record"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="graph-tools">
        <select
          aria-label="Graph record type"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="all">All records</option>
          <option value="note">Notes</option>
          <option value="topic">Study topics</option>
          <option value="project">Work projects</option>
          <option value="curriculum">Curricula</option>
        </select>
        <button
          className="icon-button"
          aria-label="Zoom out graph"
          onClick={() => setZoom((z) => Math.max(0.25, z / 1.3))}
        >
          <Minus />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom in graph"
          onClick={() => setZoom((z) => Math.min(8, z * 1.3))}
        >
          <Plus />
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <canvas
        ref={canvas}
        role="img"
        aria-label={`${graph.nodes.length} database records and ${graph.edges.length} relationships. Use the record list to select and open records.`}
        onWheel={(e) => setZoom((z) => Math.max(0.25, Math.min(8, z * (e.deltaY < 0 ? 1.1 : 0.9))))}
        onPointerDown={(e) => {
          const el = e.currentTarget,
            rect = el.getBoundingClientRect(),
            x = e.clientX,
            y = e.clientY,
            start = { ...offset.current };
          el.setPointerCapture(e.pointerId);
          let moved = false;
          el.onpointermove = (event) => {
            const dx = event.clientX - x,
              dy = event.clientY - y;
            if (Math.hypot(dx, dy) > 4) moved = true;
            offset.current = { x: start.x + dx, y: start.y + dy };
            drawing.current();
          };
          el.onpointerup = (event) => {
            el.onpointermove = null;
            if (moved) return;
            const model = layout.current;
            if (!model) return;
            const scale = (Math.min(rect.width, rect.height) / (model.radius * 2.4)) * zoom,
              px = (event.clientX - rect.left - rect.width / 2 - offset.current.x) / scale,
              py = (event.clientY - rect.top - rect.height / 2 - offset.current.y) / scale;
            const nearest = model.points.reduce<{ id: string; distance: number } | null>(
              (best, p) => {
                const distance = Math.hypot(p.x - px, p.y - py);
                return !best || distance < best.distance ? { id: p.id, distance } : best;
              },
              null,
            );
            if (nearest && nearest.distance < 12 / scale) setSelected(nearest.id);
          };
        }}
      />
      <p className="graph-count">
        {graph.nodes.length} records · {graph.edges.length} links
      </p>
      {node && (
        <section className="graph-record">
          <small>{node.kind}</small>
          <h3>{node.label}</h3>
          <button className="text-button" onClick={() => open(node)}>
            Open record
            <ArrowUpRight />
          </button>
        </section>
      )}
      <div className="graph-record-list" aria-label="Graph records">
        {matches.map((n) => (
          <button key={n.id} aria-pressed={selected === n.id} onClick={() => setSelected(n.id)}>
            <span>{n.label}</span>
            <small>{n.kind}</small>
          </button>
        ))}
        {!matches.length && <p>No matching records</p>}
      </div>
    </aside>
  );
}

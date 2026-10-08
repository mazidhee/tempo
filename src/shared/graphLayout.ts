import type { KnowledgeGraph } from './knowledge';
export interface GraphPosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}
/** Local-cell repulsion keeps large topic graphs linear in size at normal density. */
export function createGraphLayout(graph: KnowledgeGraph) {
  const radius = Math.max(100, Math.sqrt(graph.nodes.length) * 9);
  const points = graph.nodes.map((n, i) => ({
    id: n.id,
    x: Math.cos(i * 2.399963) * Math.sqrt((i + 1) / graph.nodes.length) * radius,
    y: Math.sin(i * 2.399963) * Math.sqrt((i + 1) / graph.nodes.length) * radius,
    vx: 0,
    vy: 0,
  }));
  const byId = new Map(points.map((p) => [p.id, p]));
  const springs = graph.edges
    .map((e) => ({ a: byId.get(e.source)!, b: byId.get(e.target)! }))
    .filter((e) => e.a && e.b);
  let iteration = 0;
  return {
    points,
    radius,
    step() {
      const cells = new Map<string, GraphPosition[]>(),
        cell = 35;
      for (const p of points) {
        const key = `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`;
        const list = cells.get(key) || [];
        list.push(p);
        cells.set(key, list);
        p.vx -= p.x * 0.001;
        p.vy -= p.y * 0.001;
      }
      for (const p of points) {
        const cx = Math.floor(p.x / cell),
          cy = Math.floor(p.y / cell);
        for (let x = cx - 1; x <= cx + 1; x++)
          for (let y = cy - 1; y <= cy + 1; y++)
            for (const q of cells.get(`${x},${y}`) || []) {
              if (p === q) continue;
              const dx = p.x - q.x,
                dy = p.y - q.y,
                d2 = Math.max(4, dx * dx + dy * dy),
                force = Math.min(1.5, 35 / d2);
              p.vx += dx * force;
              p.vy += dy * force;
            }
      }
      for (const { a, b } of springs) {
        const dx = b.x - a.x,
          dy = b.y - a.y,
          d = Math.hypot(dx, dy) || 1,
          f = (d - 22) * 0.014;
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
      const cooling = Math.max(0.1, 1 - iteration / 170);
      for (const p of points) {
        p.vx *= 0.55;
        p.vy *= 0.55;
        p.x += Math.max(-8, Math.min(8, p.vx)) * cooling;
        p.y += Math.max(-8, Math.min(8, p.vy)) * cooling;
      }
      return ++iteration < 150;
    },
  };
}

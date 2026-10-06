export interface WorkMilestone { id: string; title: string; due: string; completedAt: string | null }
export interface WorkProject { id: string; title: string; description: string; archived: boolean; milestones: WorkMilestone[] }
export function validWorkProjects(value: unknown): value is WorkProject[] {
  const text = (v: unknown, limit: number) => typeof v === 'string' && v.length <= limit;
  return Array.isArray(value) && value.length <= 1000 && value.every(p => p && text(p.id, 120) && !!p.id &&
    text(p.title, 200) && !!p.title.trim() && text(p.description, 2000) && typeof p.archived === 'boolean' &&
    Array.isArray(p.milestones) && p.milestones.length <= 500 && p.milestones.every((m: WorkMilestone) =>
      m && text(m.id, 120) && !!m.id && text(m.title, 500) && !!m.title.trim() && text(m.due, 10) &&
      (!m.due || /^\d{4}-\d{2}-\d{2}$/.test(m.due)) && (m.completedAt === null || (text(m.completedAt, 40) && Number.isFinite(Date.parse(m.completedAt!))))) &&
    new Set(p.milestones.map((m: WorkMilestone) => m.id)).size === p.milestones.length) &&
    new Set(value.map(p => p.id)).size === value.length;
}
export function mergeWorkProjects(current: WorkProject[] = [], incoming: WorkProject[] = []): WorkProject[] {
  return [...current.map(project => {
    const match = incoming.find(p => p.id === project.id);
    return !match ? project : { ...project, milestones: [...project.milestones,
      ...match.milestones.filter(m => !project.milestones.some(old => old.id === m.id))] };
  }), ...incoming.filter(p => !current.some(old => old.id === p.id))];
}

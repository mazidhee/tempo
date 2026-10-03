export interface BackupStatus {
  error?: string;
  repository: string;
  hasToken: boolean;
  lastUpload: string | null;
  local: { id: string; date: string; bytes: number }[];
}
export interface BackupPreview {
  data: unknown;
  summary: {
    habits: number;
    tasks: number;
    sessions: number;
    curricula: number;
    topics: number;
    exportedAt: string;
  };
}
export function backupSummary(value: unknown): BackupPreview['summary'] {
  const b = value as {
    format?: string;
    exportedAt?: string;
    habits?: unknown[];
    productivity?: { tasks?: unknown[]; sessions?: unknown[] };
    modules?: { study?: { curricula?: unknown[]; topics?: unknown[] } };
  };
  if (
    !b ||
    b.format !== 'tempo-backup' ||
    !Array.isArray(b.habits) ||
    !b.productivity ||
    !b.modules
  )
    throw new Error('This is not a complete Tempo backup.');
  return {
    habits: b.habits.length,
    tasks: b.productivity.tasks?.length || 0,
    sessions: b.productivity.sessions?.length || 0,
    curricula: b.modules.study?.curricula?.length || 0,
    topics: b.modules.study?.topics?.length || 0,
    exportedAt: b.exportedAt || '',
  };
}

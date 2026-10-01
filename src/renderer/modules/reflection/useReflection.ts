import { useEffect, useSyncExternalStore } from 'react';
import type { ReflectionSnapshot } from '../../../shared/reflection';
import type { WorkspaceEvents } from '../../../shared/workspace';
import { localDate } from '../../../shared/productivity';
let state: { snapshot: ReflectionSnapshot | null; error: string } = { snapshot: null, error: '' },
  pending: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
export async function refreshReflection() {
  if (pending) return pending;
  pending = window.workspaceAPI
    .invoke('plan:snapshot')
    .then((result) => {
      state = { snapshot: result, error: '' };
    })
    .catch((e) => {
      state = { ...state, error: String(e.message || e) };
    })
    .finally(() => {
      pending = null;
      emit();
    });
  return pending;
}
let users = 0,
  detach: () => void = () => {};
function attach() {
  users++;
  if (users === 1) {
    void refreshReflection();
    const unsub = (
      ['plan:changed', 'journal:changed', 'review:changed', 'goals:changed'] as const
    ).map((channel) =>
      window.workspaceAPI.on(channel, (result) => {
        state = { snapshot: result, error: '' };
        emit();
      }),
    );
    unsub.push(window.workspaceAPI.on('study:changed', () => void refreshReflection()));
    // Focus events denote transitions, never a per-second countdown.
    unsub.push(
      window.workspaceAPI.on(
        'focus:changed' as keyof WorkspaceEvents,
        () => void refreshReflection(),
      ),
    );
    const refresh = () => void refreshReflection();
    window.addEventListener('focus', refresh);
    window.addEventListener('workspace-data-changed', refresh);
    let lastDay = localDate();
    const timer = setInterval(() => {
      const day = localDate();
      if (day !== lastDay) {
        lastDay = day;
        refresh();
      }
    }, 60000);
    detach = () => {
      unsub.forEach((fn) => fn());
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('workspace-data-changed', refresh);
    };
  }
  return () => {
    users--;
    if (!users) detach();
  };
}
export function useReflection() {
  const current = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
  );
  useEffect(attach, []);
  return { ...current, retry: refreshReflection };
}

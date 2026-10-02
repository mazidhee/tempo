import type { Productivity } from './productivity';

/** Native timer/session state stays authoritative while queued edits retain their latest value. */
export function reconcileProductivity(
  authoritative: Productivity,
  optimistic: Productivity,
  pendingWrites: number,
): Productivity {
  return pendingWrites > 0
    ? {
        ...authoritative,
        tasks: optimistic.tasks,
        presets: optimistic.presets,
        settings: optimistic.settings,
      }
    : authoritative;
}

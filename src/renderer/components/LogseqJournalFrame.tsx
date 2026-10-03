// SPDX-License-Identifier: AGPL-3.0-only
// Adapted from Logseq journal-item, upstream 22a29b30dee3b3930cf49bba50454650c31d2a07.
// Copyright Logseq contributors. React adaptation: Tempo, October 3, 2026.
// See third-party/logseq/PROVENANCE.md and LICENSE.md for source and licence.
import { useEffect, useRef, type ReactNode } from 'react';

const heights = new Map<string, number>();
/** Keep off-screen daily pages stable, and release the observer on unmount. */
export function LogseqJournalFrame({
  date,
  render = true,
  children,
}: {
  date: string;
  render?: boolean;
  children: ReactNode;
}) {
  const element = useRef<HTMLDivElement>(null);
  const cacheKey = `${date}:${Math.round(window.innerWidth / 100)}`;
  useEffect(() => {
    if (!render || !element.current) return;
    const observer = new ResizeObserver(() => {
      const height = Math.round(element.current?.getBoundingClientRect().height || 0);
      if (height > 0) {
        heights.set(cacheKey, height);
        if (heights.size > 90) heights.delete(heights.keys().next().value!);
      }
    });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [cacheKey, render]);
  return (
    <div
      ref={element}
      className="journal-day-content"
      style={!render ? { minHeight: heights.get(cacheKey) || 640 } : undefined}
    >
      {render ? (
        children
      ) : (
        <div className="journal-page-placeholder" aria-hidden="true">
          Opening daily page…
        </div>
      )}
    </div>
  );
}

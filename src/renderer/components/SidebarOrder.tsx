import { useState } from 'react';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { navigation, type NavigationEntry } from '../registry/navigation';
import { Modal } from './ui';
export function orderedNavigation(order: string[] = []): NavigationEntry[] {
  const ids = [
    ...order.filter((id) => navigation.some((n) => n.id === id)),
    ...navigation.map((n) => n.id).filter((id) => !order.includes(id)),
  ];
  return ids.map((id) => navigation.find((n) => n.id === id)!);
}
export function SidebarOrder({ onClose }: { onClose: () => void }) {
  const { state, update } = useProductivity();
  const entries = orderedNavigation(state.settings.sidebarOrder),
    [dragged, setDragged] = useState<string | null>(null);
  const move = (from: number, to: number) => {
    if (from < 0 || to < 0 || to >= entries.length || from === to) return;
    const ids = entries.map((n) => n.id);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    update((s) => ({ ...s, settings: { ...s.settings, sidebarOrder: ids } }));
  };
  return (
    <Modal title="Arrange sidebar" onClose={onClose}>
      <ol className="sidebar-order-list">
        {entries.map((n, i) => (
          <li
            key={n.id}
            draggable
            onDragStart={() => setDragged(n.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              move(
                entries.findIndex((n) => n.id === dragged),
                i,
              );
              setDragged(null);
            }}
          >
            <GripVertical aria-hidden="true" />
            <span>{n.label}</span>
            <button
              className="icon-button"
              aria-label={`Move ${n.label} up`}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
            >
              <ArrowUp />
            </button>
            <button
              className="icon-button"
              aria-label={`Move ${n.label} down`}
              disabled={i === entries.length - 1}
              onClick={() => move(i, i + 1)}
            >
              <ArrowDown />
            </button>
          </li>
        ))}
      </ol>
      <button
        className="text-button"
        onClick={() => update((s) => ({ ...s, settings: { ...s.settings, sidebarOrder: [] } }))}
      >
        Reset order
      </button>
    </Modal>
  );
}

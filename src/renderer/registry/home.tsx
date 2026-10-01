import type { ComponentType } from 'react';
export type HomeSlot = 'today-plan' | 'goals' | 'reviews-due';
export interface HomeWidget {
  id: string;
  slot: HomeSlot;
  order: number;
  component: ComponentType;
}
export const homeWidgets: HomeWidget[] = [];
export function HomeWidgets({ slot }: { slot: HomeSlot }) {
  return homeWidgets
    .filter((widget) => widget.slot === slot)
    .sort((a, b) => a.order - b.order)
    .map(({ id, component: Widget }) => <Widget key={id} />);
}

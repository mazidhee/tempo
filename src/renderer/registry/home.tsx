import type { ComponentType } from 'react';
import { TodayPlanWidget, GoalsWidget, ReviewsDueWidget } from '../modules/reflection/widgets';
export type HomeSlot = 'today-plan' | 'goals' | 'reviews-due';
export interface HomeWidget {
  id: string;
  slot: HomeSlot;
  order: number;
  component: ComponentType;
}
export const homeWidgets: HomeWidget[] = [
  { id: 'reflection-plan', slot: 'today-plan', order: 10, component: TodayPlanWidget },
  { id: 'reflection-goals', slot: 'goals', order: 10, component: GoalsWidget },
  { id: 'reflection-reviews', slot: 'reviews-due', order: 10, component: ReviewsDueWidget },
];
export function HomeWidgets({ slot }: { slot: HomeSlot }) {
  return homeWidgets
    .filter((widget) => widget.slot === slot)
    .sort((a, b) => a.order - b.order)
    .map(({ id, component: Widget }) => <Widget key={id} />);
}

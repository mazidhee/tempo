export interface FocusWidgetPreferences {
  opacity: number;
  width: number;
  height: number;
  x?: number;
  y?: number;
}
export const defaultWidgetPreferences: FocusWidgetPreferences = {
  opacity: 1,
  width: 260,
  height: 152,
};
export function widgetOpacity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.35 || value > 1)
    throw Error('Choose opacity between 35% and 100%.');
  return value;
}
declare module './workspace' {
  interface WorkspaceRequests {
    'window:widgetShow': { input: undefined; output: void };
    'window:widgetHide': { input: undefined; output: void };
    'window:widgetOpen': { input: undefined; output: void };
    'window:widgetPreferences': { input: undefined; output: FocusWidgetPreferences };
    'window:widgetOpacity': { input: number; output: FocusWidgetPreferences };
  }
  interface WorkspaceEvents {
    'window:navigate': string;
  }
}

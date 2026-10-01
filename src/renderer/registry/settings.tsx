import type { ComponentType } from 'react';
import { FocusSettings } from '../modules/focus/FocusSettings';
export interface SettingsSection {
  id: string;
  label: string;
  order: number;
  component: ComponentType;
}
/** Module sections are additive. Stage C mounts them in the existing settings shell. */
export const settingsSections: SettingsSection[] = [
  { id: 'focus', label: 'Focus', order: 20, component: FocusSettings },
];

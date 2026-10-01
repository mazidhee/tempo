import type { ComponentType } from 'react';
export interface SettingsSection {
  id: string;
  label: string;
  order: number;
  component: ComponentType;
}
/** Module sections are additive. Stage C mounts them in the existing settings shell. */
export const settingsSections: SettingsSection[] = [];

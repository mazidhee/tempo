import type { ComponentType } from 'react';
import { FocusSettings } from '../modules/focus/FocusSettings';
import { ReflectionNotifications } from '../modules/reflection/settings';
import UserGuide from '../components/UserGuide';
import BackupSettings from '../components/BackupSettings';
export interface SettingsSection {
  id: string;
  label: string;
  order: number;
  component: ComponentType;
}
export const settingsSections: SettingsSection[] = [
  {id:'backups',label:'Backups',order:15,component:BackupSettings},
  { id: 'guide', label: 'User guide', order: 10, component: UserGuide },
  { id: 'focus', label: 'Focus', order: 20, component: FocusSettings },
  {
    id: 'reflection-notifications',
    label: 'Reflection reminders',
    order: 30,
    component: ReflectionNotifications,
  },
];

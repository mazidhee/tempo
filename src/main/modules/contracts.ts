import type Database from '../database/sqlite';
import type { BrowserWindow } from 'electron';
export interface ModuleContext {
  db: Database;
  getWindow: () => BrowserWindow | null;
  showWindow: () => void;
  isQuitting: () => boolean;
}
export interface ModuleLifecycle {
  beforeQuit?: () => Promise<void> | void;
}
export type ModuleRegistration = (context: ModuleContext) => ModuleLifecycle | void;

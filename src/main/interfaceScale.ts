import { BrowserWindow } from 'electron';
import { getDb } from './database/db';

export function storedInterfaceScale(): number {
  const row = getDb().prepare('SELECT json FROM productivity_state WHERE id=1').get() as
    { json: string } | undefined;
  const value = row ? JSON.parse(row.json).settings?.interfaceScale : undefined;
  return typeof value === 'number' && value >= 0.8 && value <= 1.25 ? value : 1;
}

export function applyInterfaceScale(): void {
  const value = storedInterfaceScale();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.setZoomFactor(value);
  }
}

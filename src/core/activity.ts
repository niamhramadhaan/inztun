import { db } from './db';

export function logToolAction(toolId: string, label: string): void {
  db.logActivity('tool-action', label, toolId);
}

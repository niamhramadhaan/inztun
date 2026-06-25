import { db } from '../core/db';

export interface DownloadedFile {
  id: string;
  name: string;
  toolId: string;
  toolName: string;
  timestamp: number;
  size: number;
}

const MAX_SESSION_BLOBS = 5;
const sessionBlobs = new Map<string, Blob>();

export async function logDownload(
  toolId: string,
  toolName: string,
  blob: Blob,
  filename: string,
): Promise<DownloadedFile> {
  const record: DownloadedFile = {
    id: crypto.randomUUID(),
    name: filename,
    toolId,
    toolName,
    timestamp: Date.now(),
    size: blob.size,
  };
  sessionBlobs.set(record.id, blob);
  if (sessionBlobs.size > MAX_SESSION_BLOBS) {
    const oldest = sessionBlobs.keys().next().value;
    if (oldest) sessionBlobs.delete(oldest);
  }
  const existing = (await db.getPreference('downloadedFiles', [])) as DownloadedFile[];
  existing.unshift(record);
  await db.setPreference('downloadedFiles', existing.slice(0, 50));
  return record;
}

export function getSessionBlob(id: string): Blob | undefined {
  return sessionBlobs.get(id);
}

export async function getRecentDownloads(limit = 20): Promise<DownloadedFile[]> {
  return ((await db.getPreference('downloadedFiles', [])) as DownloadedFile[]).slice(0, limit);
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

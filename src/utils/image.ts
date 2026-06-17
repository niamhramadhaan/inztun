import { zipSync } from 'fflate';

export function getScaledSize(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

export function getFitSize(w: number, h: number, maxW: number, maxH: number): { width: number; height: number } {
  if (w <= maxW && h <= maxH) return { width: w, height: h };
  const ratio = Math.min(maxW / w, maxH / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, type, quality);
  });
}

export function createDropZone(opts: {
  id: string;
  hint?: string;
  onFile: (file: File) => void;
}): HTMLDivElement {
  const zone = document.createElement('div');
  zone.className = 'imgc-drop-zone';
  zone.id = opts.id;
  zone.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
    <p>Drop an image here or <strong>click to browse</strong></p>
    ${opts.hint ? `<span class="imgc-drop-zone__hint">${opts.hint}</span>` : ''}
    <input type="file" accept="image/*" hidden>
  `;

  const fileInput = zone.querySelector('input')!;
  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('imgc-drop-zone--active'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('imgc-drop-zone--active'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('imgc-drop-zone--active');
    if (e.dataTransfer?.files[0]) opts.onFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) opts.onFile(fileInput.files[0]);
  });

  return zone;
}

export function createMultiDropZone(opts: {
  id: string;
  hint?: string;
  onFiles: (files: File[]) => void;
}): HTMLDivElement {
  const zone = document.createElement('div');
  zone.className = 'imgc-drop-zone';
  zone.id = opts.id;
  zone.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
    <p>Drop images here or <strong>click to browse</strong></p>
    ${opts.hint ? `<span class="imgc-drop-zone__hint">${opts.hint}</span>` : ''}
    <input type="file" accept="image/*" multiple hidden>
  `;

  const fileInput = zone.querySelector('input')!;
  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('imgc-drop-zone--active'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('imgc-drop-zone--active'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('imgc-drop-zone--active');
    if (e.dataTransfer?.files.length) opts.onFiles(Array.from(e.dataTransfer.files));
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) opts.onFiles(Array.from(fileInput.files));
  });

  return zone;
}

export function bindClipboardPaste(onFile: (file: File) => void): () => void {
  const handler = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) { onFile(file); break; }
      }
    }
  };
  document.addEventListener('paste', handler);
  return () => document.removeEventListener('paste', handler);
}

export async function downloadZip(files: Array<{ name: string; data: Blob }>, zipName: string): Promise<void> {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) {
    const buf = new Uint8Array(await f.data.arrayBuffer());
    entries[f.name] = buf;
  }
  const zipped = zipSync(entries, { level: 6 });
  const blob = new Blob([zipped], { type: 'application/zip' });
  downloadBlob(blob, zipName);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
    'image/avif': 'avif', 'image/gif': 'gif', 'image/svg+xml': 'svg',
    'image/x-icon': 'ico', 'image/bmp': 'bmp',
  };
  return map[mime] || 'png';
}

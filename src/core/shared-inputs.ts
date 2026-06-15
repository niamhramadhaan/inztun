import { db } from './db';

class SharedInputs {
  private cache: Record<string, string> = {};
  private ready: Promise<void>;
  private initialized = false;

  constructor() {
    this.ready = this.load();
  }

  private async load(): Promise<void> {
    this.cache = ((await db.getPreference('sharedInputs', {})) as Record<string, string>) || {};
    this.initialized = true;
  }

  normalizeLabel(label: string): string {
    return label
      .toLowerCase()
      .replace(/[*:]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async get(label: string): Promise<string> {
    await this.ready;
    return this.cache[this.normalizeLabel(label)] || '';
  }

  getSync(label: string): string {
    return this.cache[this.normalizeLabel(label)] || '';
  }

  async set(label: string, value: string): Promise<void> {
    await this.ready;
    const key = this.normalizeLabel(label);
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    await db.setPreference('sharedInputs', this.cache);
  }

  isReady(): boolean {
    return this.initialized;
  }

  whenReady(): Promise<void> {
    return this.ready;
  }
}

export const sharedInputs = new SharedInputs();

export function wireSharedInputs(root: HTMLElement): void {
  const labels = root.querySelectorAll('label.label[data-shared]');
  labels.forEach(labelEl => {
    const labelText = labelEl.textContent?.trim() || '';
    if (!labelText) return;

    const forId = labelEl.getAttribute('for');
    let inputEl: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;

    if (forId) {
      inputEl = root.querySelector(`#${forId}`);
    }

    if (!inputEl) {
      const parent = labelEl.closest('.form-group');
      if (parent) {
        inputEl = parent.querySelector('input, textarea, select');
      }
    }

    if (!inputEl) return;

    const key = sharedInputs.normalizeLabel(labelText);

    if (sharedInputs.isReady()) {
      const cached = sharedInputs.getSync(labelText);
      if (cached && !inputEl.value) {
        inputEl.value = cached;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      sharedInputs.whenReady().then(() => {
        const cached = sharedInputs.getSync(labelText);
        if (cached && !inputEl.value) {
          inputEl.value = cached;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }

    inputEl.addEventListener('input', () => {
      sharedInputs.set(labelText, inputEl.value);
    });
  });
}

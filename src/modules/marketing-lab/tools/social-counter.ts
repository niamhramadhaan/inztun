import { Toast } from '../../../components/Toast';

interface Platform {
  name: string;
  limit: number;
  color: string;
}

const PLATFORMS: Platform[] = [
  { name: 'Twitter / X', limit: 280, color: '#1da1f2' },
  { name: 'LinkedIn', limit: 3000, color: '#0a66c2' },
  { name: 'Instagram', limit: 2200, color: '#e4405f' },
  { name: 'Facebook', limit: 63206, color: '#1877f2' },
];

export class SocialCounter {
  id = 'social-counter';
  name = 'Social Media Counter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`;
  badge = '';
  private inputEl!: HTMLTextAreaElement;
  private barsEl!: HTMLDivElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="form-group">
          <div class="label-row"><label class="label">Your Post</label><span class="char-count" id="mls-count">0 chars</span></div>
          <textarea class="input input--textarea" id="mls-input" placeholder="Type or paste your social media post..." rows="6"></textarea>
        </div>
        <div class="mls-bars" id="mls-bars"></div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#mls-input')!;
    this.barsEl = root.querySelector('#mls-bars')!;

    this.inputEl.addEventListener('input', () => this.update());
    this.update();
  }

  private update(): void {
    const len = this.inputEl.value.length;
    const countEl = document.getElementById('mls-count');
    if (countEl) countEl.textContent = `${len} chars`;

    this.barsEl.innerHTML = PLATFORMS.map((p) => {
      const remaining = p.limit - len;
      const pct = Math.min((len / p.limit) * 100, 100);
      const isOver = remaining < 0;
      const isWarning = !isOver && remaining <= p.limit * 0.1;
      return `
        <div class="mls-bar">
          <div class="mls-bar__header">
            <span class="mls-bar__name">${p.name}</span>
            <span class="mls-bar__count" style="color:${isOver ? 'var(--color-error)' : isWarning ? 'var(--color-warning)' : p.color}">${isOver ? `${Math.abs(remaining)} over` : `${remaining} left`}</span>
          </div>
          <div class="mls-bar__track">
            <div class="mls-bar__fill" style="width:${pct}%;background:${isOver ? 'var(--color-error)' : isWarning ? 'var(--color-warning)' : p.color}"></div>
          </div>
          <div class="mls-bar__limit">${len} / ${p.limit.toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  destroy(): void {}
}

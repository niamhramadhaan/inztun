import { db } from '../core/db';
import { Toast } from './Toast';

const PIN_LENGTH = 4;

export class LockScreen {
  private overlay: HTMLDivElement | null = null;
  private dotsEl: HTMLDivElement | null = null;
  private enteredPin = '';
  private resolveUnlock: (() => void) | null = null;

  async show(): Promise<void> {
    const enabled = await db.getPreference('lockEnabled', false);
    if (!enabled) return;

    return new Promise((resolve) => {
      this.resolveUnlock = resolve;
      this.render();
      this.bindEvents();
    });
  }

  private render(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'lock-overlay';
    this.overlay.innerHTML = `
      <div class="lock-left">
        <div class="lock-brand">
          <div class="lock-brand__icon">✦</div>
          <h1 class="lock-brand__title">inztun</h1>
          <p class="lock-brand__subtitle">The Artisan's Operating System</p>
        </div>
      </div>
      <div class="lock-right">
        <div class="lock-card">
          <h2 class="lock-card__title">Welcome back</h2>
          <div class="lock-dots" id="lock-dots">
            ${Array.from({ length: PIN_LENGTH }, () => '<span class="lock-dot"></span>').join('')}
          </div>
          <div class="lock-pad">
            ${[1,2,3,4,5,6,7,8,9,'C',0,'←'].map(key => {
              const cls = key === 'C' ? 'lock-key lock-key--clear' : key === '←' ? 'lock-key lock-key--back' : 'lock-key';
              return `<button class="${cls}" data-key="${key}">${key}</button>`;
            }).join('')}
          </div>
          <button class="lock-skip" id="lock-skip">Skip →</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.dotsEl = this.overlay.querySelector('#lock-dots')!;
  }

  private bindEvents(): void {
    if (!this.overlay) return;

    this.overlay.querySelectorAll('.lock-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = (btn as HTMLElement).dataset.key!;
        this.handleKey(key);
      });
    });

    this.overlay.querySelector('#lock-skip')?.addEventListener('click', () => {
      db.setPreference('lockEnabled', false);
      db.setPreference('lockPinHash', null);
      Toast.info('Lock removed');
      this.unlock();
    });

    document.addEventListener('keydown', this._keyHandler);
  }

  private _keyHandler = (e: KeyboardEvent): void => {
    if (e.key >= '0' && e.key <= '9') this.handleKey(e.key);
    else if (e.key === 'Backspace') this.handleKey('←');
    else if (e.key === 'Escape') this.handleKey('C');
  };

  private handleKey(key: string): void {
    if (key === 'C') {
      this.enteredPin = '';
      this.updateDots();
      return;
    }
    if (key === '←') {
      this.enteredPin = this.enteredPin.slice(0, -1);
      this.updateDots();
      return;
    }

    if (this.enteredPin.length >= PIN_LENGTH) return;
    this.enteredPin += key;
    this.updateDots();

    if (this.enteredPin.length === PIN_LENGTH) {
      this.verifyPin();
    }
  }

  private updateDots(): void {
    if (!this.dotsEl) return;
    const dots = this.dotsEl.querySelectorAll('.lock-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('lock-dot--filled', i < this.enteredPin.length);
    });
  }

  private async verifyPin(): Promise<void> {
    const hash = await this.sha256(this.enteredPin);
    const storedHash = await db.getPreference('lockPinHash', '');

    if (hash === storedHash) {
      this.markSuccess();
      setTimeout(() => this.unlock(), 400);
    } else {
      this.markError();
      setTimeout(() => {
        this.enteredPin = '';
        this.updateDots();
      }, 600);
    }
  }

  private markSuccess(): void {
    if (!this.dotsEl) return;
    this.dotsEl.querySelectorAll('.lock-dot').forEach(dot => {
      dot.classList.add('lock-dot--success');
    });
  }

  private markError(): void {
    if (!this.dotsEl) return;
    this.dotsEl.classList.add('lock-dots--shake');
    this.dotsEl.querySelectorAll('.lock-dot').forEach(dot => {
      dot.classList.add('lock-dot--error');
    });
    setTimeout(() => {
      this.dotsEl?.classList.remove('lock-dots--shake');
      this.dotsEl?.querySelectorAll('.lock-dot').forEach(dot => {
        dot.classList.remove('lock-dot--error');
      });
    }, 500);
  }

  private unlock(): void {
    this.destroy();
    this.resolveUnlock?.();
  }

  private async sha256(input: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  destroy(): void {
    document.removeEventListener('keydown', this._keyHandler);
    this.overlay?.remove();
    this.overlay = null;
  }
}

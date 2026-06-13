export class Toast {
  static container = null;

  static init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);

    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        bottom: var(--space-8);
        left: 50%;
        transform: translateX(-50%);
        z-index: 500;
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        gap: var(--space-2);
        pointer-events: none;
      }

      .toast {
        padding: var(--space-2) var(--space-4);
        background: var(--bg-elevated);
        border: 1px solid var(--border-hairline);
        border-radius: var(--radius-pill);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
        pointer-events: auto;
        animation: toastIn 300ms var(--ease-out);
        display: flex;
        align-items: center;
        gap: var(--space-2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      .toast--success {
        border-color: rgba(74, 222, 128, 0.3);
      }

      .toast--success .toast__icon {
        color: var(--color-success);
      }

      .toast--error {
        border-color: rgba(248, 113, 113, 0.3);
      }

      .toast--error .toast__icon {
        color: var(--color-error);
      }

      .toast--info {
        border-color: var(--accent-border);
      }

      .toast--info .toast__icon {
        color: var(--accent);
      }

      .toast__icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .toast--exit {
        animation: toastOut 200ms var(--ease-out) forwards;
      }

      @keyframes toastIn {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes toastOut {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(12px) scale(0.95);
        }
      }
    `;
    document.head.appendChild(style);
  }

  static show(message, type = 'success', duration = 2500) {
    this.init();

    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <span class="toast__message">${message}</span>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast--exit');
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  static success(message, duration) {
    this.show(message, 'success', duration);
  }

  static error(message, duration) {
    this.show(message, 'error', duration);
  }

  static info(message, duration) {
    this.show(message, 'info', duration);
  }

  static copied(what = 'Copied') {
    this.success(`${what} to clipboard`);
  }
}

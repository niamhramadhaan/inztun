import { Toast } from '../../../components/Toast';

export class JwtDecoder {
  id = 'jwt-decoder';
  name = 'JWT Decoder';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>`;
  badge = '';
  private inputEl!: HTMLTextAreaElement;
  private partsEl!: HTMLDivElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="form-group">
          <label class="label">JWT Token</label>
          <textarea class="input input--textarea" id="jwt-input" placeholder="Paste your JWT token here..." rows="4" spellcheck="false">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</textarea>
        </div>
        <div class="jwt-parts" id="jwt-parts"></div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#jwt-input') as HTMLTextAreaElement;
    this.partsEl = root.querySelector('#jwt-parts') as HTMLDivElement;

    this.inputEl?.addEventListener('input', () => this.decode());
    this.decode();
  }

  decode(): void {
    const token = this.inputEl.value.trim();
    if (!token) {
      this.partsEl.innerHTML = '';
      return;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      this.partsEl.innerHTML = '<div class="jwt-error">Invalid JWT format. Expected 3 parts separated by dots.</div>';
      return;
    }

    try {
      const header = JSON.parse(atob(parts[0])) as Record<string, unknown>;
      const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;

      const expVal = payload.exp as number | undefined;
      const iatVal = payload.iat as number | undefined;
      const isExpired = expVal !== undefined && expVal * 1000 < Date.now();
      const expiresAt = expVal !== undefined ? new Date(expVal * 1000).toLocaleString() : 'N/A';
      const issuedAt = iatVal !== undefined ? new Date(iatVal * 1000).toLocaleString() : 'N/A';

      this.partsEl.innerHTML = `
        <div class="jwt-section">
          <div class="jwt-section__header">
            <span class="jwt-section__title">Header</span>
            <button class="btn btn--ghost btn--sm" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(header)}, null, 2))">Copy</button>
          </div>
          <pre class="jwt-code">${JSON.stringify(header, null, 2)}</pre>
        </div>
        <div class="jwt-section">
          <div class="jwt-section__header">
            <span class="jwt-section__title">Payload</span>
            <button class="btn btn--ghost btn--sm" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(payload)}, null, 2))">Copy</button>
          </div>
          <pre class="jwt-code">${JSON.stringify(payload, null, 2)}</pre>
        </div>
        <div class="jwt-meta">
          <div class="jwt-meta__item">
            <span class="jwt-meta__label">Algorithm</span>
            <span class="jwt-meta__value">${(header.alg as string) || 'N/A'}</span>
          </div>
          <div class="jwt-meta__item">
            <span class="jwt-meta__label">Issued At</span>
            <span class="jwt-meta__value">${issuedAt}</span>
          </div>
          <div class="jwt-meta__item">
            <span class="jwt-meta__label">Expires At</span>
            <span class="jwt-meta__value ${isExpired ? 'jwt-meta__value--expired' : ''}">${expiresAt} ${isExpired ? '(EXPIRED)' : ''}</span>
          </div>
        </div>
      `;
    } catch (e) {
      this.partsEl.innerHTML = `<div class="jwt-error">Failed to decode: ${(e as Error).message}</div>`;
    }
  }

  destroy(): void {}
}

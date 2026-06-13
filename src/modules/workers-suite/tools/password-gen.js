import { Toast } from '../../../components/Toast.js';

export class PasswordGenerator {
  constructor() {
    this.id = 'password-gen';
    this.name = 'Password Generator';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>`;
    this.badge = 'Secure';
  }

  render() {
    return `
      <div class="tool-area">
        <div class="password-display">
          <div class="password-output" id="pg-output">Click Generate</div>
          <button class="btn btn--ghost" id="pg-copy">Copy</button>
        </div>
        <div class="password-strength" id="pg-strength"></div>
        <div class="form-group">
          <label class="label">Length: <span id="pg-length-val">16</span></label>
          <input type="range" id="pg-length" min="4" max="64" value="16" class="password-slider">
        </div>
        <div class="password-options">
          <label class="checkbox-label">
            <input type="checkbox" id="pg-upper" checked>
            <span>Uppercase (A-Z)</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="pg-lower" checked>
            <span>Lowercase (a-z)</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="pg-numbers" checked>
            <span>Numbers (0-9)</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="pg-symbols" checked>
            <span>Symbols (!@#$%)</span>
          </label>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="pg-generate">Generate</button>
          <button class="btn btn--ghost" id="pg-generate-5">Generate 5</button>
        </div>
        <div class="password-list" id="pg-list"></div>
      </div>
    `;
  }

  init(root) {
    this.outputEl = root.querySelector('#pg-output');
    this.strengthEl = root.querySelector('#pg-strength');
    this.lengthEl = root.querySelector('#pg-length');
    this.lengthValEl = root.querySelector('#pg-length-val');
    this.listEl = root.querySelector('#pg-list');

    this.options = {
      upper: root.querySelector('#pg-upper'),
      lower: root.querySelector('#pg-lower'),
      numbers: root.querySelector('#pg-numbers'),
      symbols: root.querySelector('#pg-symbols'),
    };

    this.lengthEl?.addEventListener('input', () => {
      this.lengthValEl.textContent = this.lengthEl.value;
    });

    const bind = (id, fn) => root.querySelector(`#${id}`)?.addEventListener('click', fn);

    bind('pg-generate', () => this.generateSingle());
    bind('pg-generate-5', () => this.generateMultiple(5));
    bind('pg-copy', () => {
      navigator.clipboard.writeText(this.outputEl.textContent);
      Toast.copied('Password');
    });

    this.generateSingle();
  }

  getCharset() {
    let charset = '';
    if (this.options.upper?.checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (this.options.lower?.checked) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (this.options.numbers?.checked) charset += '0123456789';
    if (this.options.symbols?.checked) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    return charset;
  }

  generatePassword(length) {
    const charset = this.getCharset();
    if (!charset) return '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, x => charset[x % charset.length]).join('');
  }

  generateSingle() {
    const length = parseInt(this.lengthEl.value) || 16;
    const password = this.generatePassword(length);
    this.outputEl.textContent = password;
    this.updateStrength(password);
    this.listEl.innerHTML = '';
  }

  generateMultiple(count) {
    const length = parseInt(this.lengthEl.value) || 16;
    const passwords = Array.from({ length: count }, () => this.generatePassword(length));
    
    this.outputEl.textContent = passwords[0];
    this.updateStrength(passwords[0]);

    this.listEl.innerHTML = passwords.map(p => `
      <div class="password-item">
        <span class="password-item__value">${p}</span>
        <button class="btn btn--ghost btn--sm password-item__copy">Copy</button>
      </div>
    `).join('');

    this.listEl.querySelectorAll('.password-item__copy').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(passwords[i]);
        Toast.copied('Password');
      });
    });
  }

  updateStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#22d3ee'];
    const level = Math.min(Math.floor(score / 1.5), 5);

    this.strengthEl.innerHTML = `
      <div class="strength-bar">
        ${Array.from({ length: 5 }, (_, i) => 
          `<div class="strength-segment" style="background: ${i <= level ? colors[level] : 'var(--bg-glass)'}"></div>`
        ).join('')}
      </div>
      <span class="strength-label" style="color: ${colors[level]}">${levels[level]}</span>
    `;
  }

  destroy() {}
}

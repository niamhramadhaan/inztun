import { Toast } from '../../../components/Toast.js';

export class NumberBaseConverter {
  constructor() {
    this.id = 'number-base';
    this.name = 'Number Base Converter';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>`;
    this.badge = '';
  }

  render() {
    return `
      <div class="tool-area">
        <div class="form-group">
          <label class="label">Input Number</label>
          <input class="input" id="nb-input" type="text" value="255" placeholder="Enter a number...">
        </div>
        <div class="form-group">
          <label class="label">Input Base</label>
          <select class="input" id="nb-base">
            <option value="10" selected>Decimal (10)</option>
            <option value="2">Binary (2)</option>
            <option value="8">Octal (8)</option>
            <option value="16">Hexadecimal (16)</option>
          </select>
        </div>
        <div class="base-results" id="nb-results"></div>
      </div>
    `;
  }

  init(root) {
    this.inputEl = root.querySelector('#nb-input');
    this.baseEl = root.querySelector('#nb-base');
    this.resultsEl = root.querySelector('#nb-results');

    this.inputEl?.addEventListener('input', () => this.convert());
    this.baseEl?.addEventListener('change', () => this.convert());
    this.convert();
  }

  convert() {
    const input = this.inputEl.value.trim();
    const base = parseInt(this.baseEl.value);

    if (!input) {
      this.resultsEl.innerHTML = '';
      return;
    }

    try {
      const decimal = parseInt(input, base);
      if (isNaN(decimal)) throw new Error('Invalid number');

      const results = [
        { label: 'Decimal (10)', value: decimal.toString(10), copyable: true },
        { label: 'Binary (2)', value: decimal.toString(2), copyable: true },
        { label: 'Octal (8)', value: decimal.toString(8), copyable: true },
        { label: 'Hexadecimal (16)', value: decimal.toString(16).toUpperCase(), copyable: true },
      ];

      this.resultsEl.innerHTML = results.map(r => `
        <div class="base-item">
          <span class="base-label">${r.label}</span>
          <span class="base-value">${r.value}</span>
          ${r.copyable ? `<button class="btn btn--ghost btn--sm base-copy" data-value="${r.value}">Copy</button>` : ''}
        </div>
      `).join('');

      this.resultsEl.querySelectorAll('.base-copy').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.value);
          Toast.copied(btn.dataset.value);
        });
      });
    } catch (e) {
      this.resultsEl.innerHTML = '<div class="base-error">Invalid number for selected base</div>';
    }
  }

  destroy() {}
}

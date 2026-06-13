import { Toast } from '../../../components/Toast.js';

export class CssUnitConverter {
  constructor() {
    this.id = 'css-unit';
    this.name = 'CSS Unit Converter';
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
          <label class="label">Value</label>
          <input class="input" id="cu-value" type="number" value="16" step="any">
        </div>
        <div class="form-group">
          <label class="label">From</label>
          <select class="input" id="cu-from">
            <option value="px" selected>px</option>
            <option value="rem">rem</option>
            <option value="em">em</option>
            <option value="vw">vw</option>
            <option value="vh">vh</option>
            <option value="%">%</option>
            <option value="pt">pt</option>
            <option value="cm">cm</option>
            <option value="mm">mm</option>
            <option value="in">in</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">Base Font Size: <span id="cu-base-val">16</span>px</label>
          <input type="range" id="cu-base" min="8" max="32" value="16" class="password-slider">
        </div>
        <div class="form-group">
          <label class="label">Viewport Width: <span id="cu-vw-val">1920</span>px</label>
          <input type="range" id="cu-vw" min="320" max="3840" value="1920" class="password-slider">
        </div>
        <div class="unit-results" id="cu-results"></div>
      </div>
    `;
  }

  init(root) {
    this.valueEl = root.querySelector('#cu-value');
    this.fromEl = root.querySelector('#cu-from');
    this.baseEl = root.querySelector('#cu-base');
    this.baseValEl = root.querySelector('#cu-base-val');
    this.vwEl = root.querySelector('#cu-vw');
    this.vwValEl = root.querySelector('#cu-vw-val');
    this.resultsEl = root.querySelector('#cu-results');

    const handler = () => this.convert();
    this.valueEl?.addEventListener('input', handler);
    this.fromEl?.addEventListener('change', handler);
    this.baseEl?.addEventListener('input', () => {
      this.baseValEl.textContent = this.baseEl.value;
      this.convert();
    });
    this.vwEl?.addEventListener('input', () => {
      this.vwValEl.textContent = this.vwEl.value;
      this.convert();
    });

    this.convert();
  }

  convert() {
    const value = parseFloat(this.valueEl.value);
    const from = this.fromEl.value;
    const baseSize = parseFloat(this.baseEl.value);
    const viewportWidth = parseFloat(this.vwEl.value);

    if (isNaN(value)) {
      this.resultsEl.innerHTML = '';
      return;
    }

    // Convert to px first
    let px;
    switch (from) {
      case 'px': px = value; break;
      case 'rem': px = value * baseSize; break;
      case 'em': px = value * baseSize; break;
      case 'vw': px = (value / 100) * viewportWidth; break;
      case 'vh': px = (value / 100) * (viewportWidth * 0.5625); break;
      case '%': px = (value / 100) * baseSize; break;
      case 'pt': px = value * 1.333; break;
      case 'cm': px = value * 37.795; break;
      case 'mm': px = value * 3.7795; break;
      case 'in': px = value * 96; break;
      default: px = value;
    }

    const results = [
      { unit: 'px', value: px },
      { unit: 'rem', value: px / baseSize },
      { unit: 'em', value: px / baseSize },
      { unit: 'vw', value: (px / viewportWidth) * 100 },
      { unit: 'vh', value: (px / (viewportWidth * 0.5625)) * 100 },
      { unit: '%', value: (px / baseSize) * 100 },
      { unit: 'pt', value: px / 1.333 },
      { unit: 'cm', value: px / 37.795 },
      { unit: 'mm', value: px / 3.7795 },
      { unit: 'in', value: px / 96 },
    ];

    this.resultsEl.innerHTML = results.map(r => `
      <div class="unit-item">
        <span class="unit-label">${r.unit}</span>
        <span class="unit-value">${r.value.toFixed(4)}</span>
        <button class="btn btn--ghost btn--sm unit-copy" data-value="${r.value.toFixed(4)}${r.unit}">Copy</button>
      </div>
    `).join('');

    this.resultsEl.querySelectorAll('.unit-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.value);
        Toast.copied(btn.dataset.value);
      });
    });
  }

  destroy() {}
}

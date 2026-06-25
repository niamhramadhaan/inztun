import { Toast } from '../../../components/Toast';
import { copyToClipboard } from '../../../utils/image';

export class CssUnitConverter {
  id = 'css-unit';
  name = 'CSS Unit Converter';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>`;
  badge = '';
  private valueEl!: HTMLInputElement;
  private fromEl!: HTMLSelectElement;
  private baseEl!: HTMLInputElement;
  private baseValEl!: HTMLSpanElement;
  private vwEl!: HTMLInputElement;
  private vwValEl!: HTMLSpanElement;
  private resultsEl!: HTMLDivElement;

  render(): string {
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

  init(root: HTMLElement): void {
    this.valueEl = root.querySelector('#cu-value') as HTMLInputElement;
    this.fromEl = root.querySelector('#cu-from') as HTMLSelectElement;
    this.baseEl = root.querySelector('#cu-base') as HTMLInputElement;
    this.baseValEl = root.querySelector('#cu-base-val') as HTMLSpanElement;
    this.vwEl = root.querySelector('#cu-vw') as HTMLInputElement;
    this.vwValEl = root.querySelector('#cu-vw-val') as HTMLSpanElement;
    this.resultsEl = root.querySelector('#cu-results') as HTMLDivElement;

    const handler = (): void => this.convert();
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

  convert(): void {
    const value = parseFloat(this.valueEl.value as string);
    const from = this.fromEl.value;
    const baseSize = parseFloat(this.baseEl.value);
    const viewportWidth = parseFloat(this.vwEl.value);

    if (isNaN(value)) {
      this.resultsEl.innerHTML = '';
      return;
    }

    // Convert to px first
    let px: number;
    switch (from) {
      case 'px':
        px = value;
        break;
      case 'rem':
        px = value * baseSize;
        break;
      case 'em':
        px = value * baseSize;
        break;
      case 'vw':
        px = (value / 100) * viewportWidth;
        break;
      case 'vh':
        px = (value / 100) * (viewportWidth * 0.5625);
        break;
      case '%':
        px = (value / 100) * baseSize;
        break;
      case 'pt':
        px = value * 1.333;
        break;
      case 'cm':
        px = value * 37.795;
        break;
      case 'mm':
        px = value * 3.7795;
        break;
      case 'in':
        px = value * 96;
        break;
      default:
        px = value;
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

    this.resultsEl.innerHTML = results
      .map(
        (r: { unit: string; value: number }) => `
      <div class="unit-item">
        <span class="unit-label">${r.unit}</span>
        <span class="unit-value">${r.value.toFixed(4)}</span>
        <button class="btn btn--ghost btn--sm unit-copy" data-value="${r.value.toFixed(4)}${r.unit}">Copy</button>
      </div>
    `,
      )
      .join('');

    this.resultsEl.querySelectorAll('.unit-copy').forEach((btn: Element) => {
      (btn as HTMLElement).addEventListener('click', () => {
        void copyToClipboard((btn as HTMLElement).dataset.value || '');
        Toast.copied((btn as HTMLElement).dataset.value || '');
      });
    });
  }

  destroy(): void {}
}

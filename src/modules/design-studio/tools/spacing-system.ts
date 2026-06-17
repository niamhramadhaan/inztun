import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';

export class SpacingSystem {
  id = 'spacing-system';
  name = 'Spacing System Generator';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 3H3v18h18V3z"/>
      <path d="M3 9h18"/>
      <path d="M3 15h18"/>
      <path d="M9 3v18"/>
      <path d="M15 3v18"/>
    </svg>`;
  badge = '';
  private previewEl!: HTMLDivElement;
  private outputEl!: HTMLPreElement;
  private baseSelect!: HTMLSelectElement;
  private stepsInput!: HTMLInputElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="dss-controls">
          <div class="form-group"><label class="label">Base Unit</label>
            <select class="input" id="dss-base">
              <option value="4">4px</option>
              <option value="8" selected>8px</option>
              <option value="12">12px</option>
            </select>
          </div>
          <div class="form-group"><label class="label">Steps</label><input type="number" id="dss-steps" value="8" min="4" max="16" class="input" style="width:80px"></div>
        </div>
        <div class="dss-preview" id="dss-preview"></div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="dss-copy">Copy CSS</button>
        </div>
        <pre class="input input--textarea" id="dss-output" style="min-height:100px;cursor:text;"></pre>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.previewEl = root.querySelector('#dss-preview')!;
    this.outputEl = root.querySelector('#dss-output')!;
    this.baseSelect = root.querySelector('#dss-base')!;
    this.stepsInput = root.querySelector('#dss-steps')!;

    this.baseSelect.addEventListener('change', () => this.update());
    this.stepsInput.addEventListener('input', () => this.update());

    root.querySelector('#dss-copy')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.outputEl.textContent || '');
      Toast.copied('CSS');
      logToolAction('spacing-system', 'Copied spacing system CSS');
    });

    this.update();
  }

  private update(): void {
    const base = parseInt(this.baseSelect.value);
    const steps = parseInt(this.stepsInput.value) || 8;

    let previewHtml = '';
    let cssVars = ':root {\n';

    for (let i = 0; i < steps; i++) {
      const size = base * (i + 1);
      const name = i + 1;
      previewHtml += `<div class="dss-step"><div class="dss-step__bar" style="width:${size}px"></div><span class="dss-step__label">${name}</span><span class="dss-step__value">${size}px / ${(size / 16).toFixed(3)}rem</span></div>`;
      cssVars += `  --space-${name}: ${(size / 16).toFixed(3)}rem;\n`;
    }
    cssVars += '}';

    this.previewEl.innerHTML = previewHtml;
    this.outputEl.textContent = cssVars;
  }

  destroy(): void {}
}

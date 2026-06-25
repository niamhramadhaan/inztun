import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { copyToClipboard } from '../../../utils/image';

interface ScaleStep {
  name: string;
  ratio: number;
}

const SCALES: ScaleStep[] = [
  { name: 'Minor Second', ratio: 1.067 },
  { name: 'Major Second', ratio: 1.125 },
  { name: 'Minor Third', ratio: 1.2 },
  { name: 'Major Third', ratio: 1.25 },
  { name: 'Perfect Fourth', ratio: 1.333 },
  { name: 'Augmented Fourth', ratio: 1.414 },
  { name: 'Perfect Fifth', ratio: 1.5 },
  { name: 'Golden Ratio', ratio: 1.618 },
];

export class TypographyScale {
  id = 'typography-scale';
  name = 'Typography Scale Calculator';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>`;
  badge = '';
  private previewEl!: HTMLDivElement;
  private outputEl!: HTMLPreElement;
  private baseInput!: HTMLInputElement;
  private scaleSelect!: HTMLSelectElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="dst-controls">
          <div class="form-group"><label class="label">Base Size (px)</label><input type="number" id="dst-base" value="16" min="8" max="32" class="input" style="width:80px"></div>
          <div class="form-group"><label class="label">Scale Ratio</label>
            <select class="input" id="dst-scale">
              ${SCALES.map((s, i) => `<option value="${i}">${s.name} (${s.ratio})</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="dst-preview" id="dst-preview"></div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="dst-copy">Copy CSS</button>
        </div>
        <pre class="input input--textarea" id="dst-output" style="min-height:80px;cursor:text;"></pre>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.previewEl = root.querySelector('#dst-preview')!;
    this.outputEl = root.querySelector('#dst-output')!;
    this.baseInput = root.querySelector('#dst-base')!;
    this.scaleSelect = root.querySelector('#dst-scale')!;

    this.baseInput.addEventListener('input', () => this.update());
    this.scaleSelect.addEventListener('change', () => this.update());

    root.querySelector('#dst-copy')!.addEventListener('click', () => {
      void copyToClipboard(this.outputEl.textContent || '');
      Toast.copied('CSS');
      logToolAction('typography-scale', 'Copied typography scale CSS');
    });

    this.update();
  }

  private update(): void {
    const base = parseInt(this.baseInput.value) || 16;
    const scale = SCALES[parseInt(this.scaleSelect.value)].ratio;
    const steps = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
    const ratios = [-2, -1, 0, 1, 2, 3, 4, 5, 6];

    let previewHtml = '';
    let cssVars = ':root {\n';

    steps.forEach((name, i) => {
      const size = Math.round(base * scale ** ratios[i] * 100) / 100;
      const rem = (size / 16).toFixed(3);
      previewHtml += `<div class="dst-step"><span class="dst-step__label">${name}</span><span class="dst-step__size" style="font-size:${rem}rem">Aa</span><span class="dst-step__value">${size}px / ${rem}rem</span></div>`;
      cssVars += `  --text-${name}: ${rem}rem;\n`;
    });
    cssVars += '}';

    this.previewEl.innerHTML = previewHtml;
    this.outputEl.textContent = cssVars;
  }

  destroy(): void {}
}

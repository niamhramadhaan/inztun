import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { copyToClipboard } from '../../../utils/image';

const PRESETS: Array<{
  name: string;
  css: string;
  stops: Array<{ color: string; position: number }>;
  type: string;
  angle: number;
}> = [
  {
    name: 'Sunset',
    css: '',
    stops: [
      { color: '#ff512f', position: 0 },
      { color: '#f09819', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Ocean',
    css: '',
    stops: [
      { color: '#2193b0', position: 0 },
      { color: '#6dd5ed', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Purple Haze',
    css: '',
    stops: [
      { color: '#7b4397', position: 0 },
      { color: '#dc2430', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Emerald',
    css: '',
    stops: [
      { color: '#11998e', position: 0 },
      { color: '#38ef7d', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Midnight',
    css: '',
    stops: [
      { color: '#232526', position: 0 },
      { color: '#414345', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Peach',
    css: '',
    stops: [
      { color: '#ffecd2', position: 0 },
      { color: '#fcb69f', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Aurora',
    css: '',
    stops: [
      { color: '#00c6ff', position: 0 },
      { color: '#0072ff', position: 50 },
      { color: '#7209b7', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Fire',
    css: '',
    stops: [
      { color: '#f12711', position: 0 },
      { color: '#f5af19', position: 100 },
    ],
    type: 'linear',
    angle: 90,
  },
  {
    name: 'Neon',
    css: '',
    stops: [
      { color: '#00f260', position: 0 },
      { color: '#0575e6', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Rose',
    css: '',
    stops: [
      { color: '#ee9ca7', position: 0 },
      { color: '#ffdde1', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Gold',
    css: '',
    stops: [
      { color: '#f7971e', position: 0 },
      { color: '#ffd200', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Steel',
    css: '',
    stops: [
      { color: '#485563', position: 0 },
      { color: '#29323c', position: 100 },
    ],
    type: 'linear',
    angle: 135,
  },
  {
    name: 'Radial Sunset',
    css: '',
    stops: [
      { color: '#ff512f', position: 0 },
      { color: '#f09819', position: 100 },
    ],
    type: 'radial',
    angle: 0,
  },
  {
    name: 'Radial Ocean',
    css: '',
    stops: [
      { color: '#6dd5ed', position: 0 },
      { color: '#2193b0', position: 100 },
    ],
    type: 'radial',
    angle: 0,
  },
  {
    name: 'Conic Rainbow',
    css: '',
    stops: [
      { color: '#ff0000', position: 0 },
      { color: '#ffff00', position: 17 },
      { color: '#00ff00', position: 33 },
      { color: '#00ffff', position: 50 },
      { color: '#0000ff', position: 67 },
      { color: '#ff00ff', position: 83 },
      { color: '#ff0000', position: 100 },
    ],
    type: 'conic',
    angle: 0,
  },
];

export class CssGradient {
  id = 'css-gradient';
  name = 'CSS Gradient Builder';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 3l18 18"/>
      <circle cx="8" cy="8" r="2" fill="currentColor"/>
      <circle cx="16" cy="16" r="2" fill="currentColor"/>
    </svg>`;
  badge = 'Popular';
  private previewEl!: HTMLDivElement;
  private outputEl!: HTMLPreElement;
  private typeSelect!: HTMLSelectElement;
  private angleSlider!: HTMLInputElement;
  private angleValEl!: HTMLSpanElement;
  private stopsContainer!: HTMLDivElement;
  private presetsEl!: HTMLDivElement;
  private stops: Array<{ color: string; position: number }> = [
    { color: '#c9a96e', position: 0 },
    { color: '#8a6d3a', position: 100 },
  ];

  render(): string {
    return `
      <div class="tool-area">
        <div class="dsg-gradient-controls">
          <div class="form-group">
            <label class="label">Type</label>
            <select class="input" id="dsg-type">
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
              <option value="conic">Conic</option>
            </select>
          </div>
          <div class="form-group" id="dsg-angle-group">
            <label class="label">Angle: <span id="dsg-angle-val">135</span>deg</label>
            <input type="range" id="dsg-angle" min="0" max="360" value="135" class="password-slider">
          </div>
        </div>
        <div class="dsg-gradient-preview" id="dsg-preview" style="height:160px;border-radius:var(--radius-lg);"></div>
        <div class="dsg-stops" id="dsg-stops"></div>
        <button class="btn btn--sm" id="dsg-add-stop">+ Add Stop</button>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="dsg-copy">Copy CSS</button>
          <button class="btn btn--primary" id="dsg-download-png">Download PNG</button>
        </div>
        <pre class="input input--textarea" id="dsg-output" style="min-height:60px;cursor:text;"></pre>

        <div class="dsg-presets" id="dsg-presets">
          <label class="label">Presets</label>
          <div class="dsg-presets-grid" id="dsg-presets-grid"></div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.previewEl = root.querySelector('#dsg-preview')!;
    this.outputEl = root.querySelector('#dsg-output')!;
    this.typeSelect = root.querySelector('#dsg-type')!;
    this.angleSlider = root.querySelector('#dsg-angle')!;
    this.angleValEl = root.querySelector('#dsg-angle-val')!;
    this.stopsContainer = root.querySelector('#dsg-stops')!;
    this.presetsEl = root.querySelector('#dsg-presets-grid')!;
    const angleGroup = root.querySelector('#dsg-angle-group') as HTMLElement;

    this.typeSelect.addEventListener('change', () => {
      angleGroup.style.display = this.typeSelect.value === 'linear' ? '' : 'none';
      this.update();
    });

    this.angleSlider.addEventListener('input', () => {
      this.angleValEl.textContent = this.angleSlider.value;
      this.update();
    });

    root.querySelector('#dsg-add-stop')!.addEventListener('click', () => {
      this.stops.push({ color: '#60a5fa', position: 50 });
      this.renderStops();
      this.update();
    });

    root.querySelector('#dsg-copy')!.addEventListener('click', () => {
      void copyToClipboard(this.outputEl.textContent || '');
      Toast.copied('CSS');
      logToolAction('css-gradient', 'Copied CSS gradient');
    });

    root.querySelector('#dsg-download-png')!.addEventListener('click', () => this.downloadPng());

    this.renderPresets();
    this.renderStops();
    this.update();
  }

  private renderPresets(): void {
    this.presetsEl.innerHTML = PRESETS.map((preset, i) => {
      const stopsStr = preset.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
      let css: string;
      if (preset.type === 'linear') css = `linear-gradient(${preset.angle}deg, ${stopsStr})`;
      else if (preset.type === 'radial') css = `radial-gradient(circle, ${stopsStr})`;
      else css = `conic-gradient(from ${preset.angle}deg, ${stopsStr})`;
      return `<button class="dsg-preset-btn" data-i="${i}" title="${preset.name}" style="background:${css}"></button>`;
    }).join('');

    this.presetsEl.querySelectorAll('.dsg-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt((btn as HTMLElement).dataset.i!);
        const preset = PRESETS[i];
        this.stops = preset.stops.map((s) => ({ ...s }));
        this.typeSelect.value = preset.type;
        this.angleSlider.value = String(preset.angle);
        this.angleValEl.textContent = String(preset.angle);
        const angleGroup = this.typeSelect
          .closest('.tool-area')!
          .querySelector('#dsg-angle-group') as HTMLElement;
        angleGroup.style.display = preset.type === 'linear' ? '' : 'none';
        this.renderStops();
        this.update();
        Toast.info(`Loaded "${preset.name}" preset`);
      });
    });
  }

  private renderStops(): void {
    this.stopsContainer.innerHTML = this.stops
      .map(
        (stop, i) => `
      <div class="dsg-stop">
        <input type="color" value="${stop.color}" class="dsg-stop__color" data-i="${i}">
        <input type="range" min="0" max="100" value="${stop.position}" class="dsg-stop__pos password-slider" data-i="${i}">
        <span class="dsg-stop__val">${stop.position}%</span>
        ${this.stops.length > 2 ? `<button class="btn btn--ghost btn--sm dsg-stop__remove" data-i="${i}">×</button>` : ''}
      </div>
    `,
      )
      .join('');

    this.stopsContainer.querySelectorAll('.dsg-stop__color').forEach((el) => {
      el.addEventListener('input', (e) => {
        const i = parseInt((e.target as HTMLElement).dataset.i!);
        this.stops[i].color = (e.target as HTMLInputElement).value;
        this.update();
      });
    });

    this.stopsContainer.querySelectorAll('.dsg-stop__pos').forEach((el) => {
      el.addEventListener('input', (e) => {
        const i = parseInt((e.target as HTMLElement).dataset.i!);
        this.stops[i].position = parseInt((e.target as HTMLInputElement).value);
        (e.target as HTMLElement)
          .closest('.dsg-stop')!
          .querySelector('.dsg-stop__val')!.textContent = this.stops[i].position + '%';
        this.update();
      });
    });

    this.stopsContainer.querySelectorAll('.dsg-stop__remove').forEach((el) => {
      el.addEventListener('click', (e) => {
        const i = parseInt((e.target as HTMLElement).dataset.i!);
        this.stops.splice(i, 1);
        this.renderStops();
        this.update();
      });
    });
  }

  private buildGradient(): string {
    const sorted = [...this.stops].sort((a, b) => a.position - b.position);
    const stopsStr = sorted.map((s) => `${s.color} ${s.position}%`).join(', ');
    const type = this.typeSelect.value;
    if (type === 'linear') return `linear-gradient(${this.angleSlider.value}deg, ${stopsStr})`;
    if (type === 'radial') return `radial-gradient(circle, ${stopsStr})`;
    return `conic-gradient(from ${this.angleSlider.value}deg, ${stopsStr})`;
  }

  private update(): void {
    const css = this.buildGradient();
    this.previewEl.style.background = css;
    this.outputEl.textContent = `background: ${css};`;
  }

  private downloadPng(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    const sorted = [...this.stops].sort((a, b) => a.position - b.position);
    const type = this.typeSelect.value;
    const w = 1920;
    const h = 1080;

    if (type === 'radial') {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
      for (const s of sorted) grad.addColorStop(s.position / 100, s.color);
      ctx.fillStyle = grad;
    } else if (type === 'conic' && ctx.createConicGradient) {
      const angle = (parseFloat(this.angleSlider.value) * Math.PI) / 180;
      const grad = ctx.createConicGradient(angle, w / 2, h / 2);
      for (const s of sorted) grad.addColorStop(s.position / 100, s.color);
      ctx.fillStyle = grad;
    } else {
      // ponytail: CSS angle 0=to top, 90=to right; canvas needs x1,y1,x2,y2
      const angle = parseFloat(this.angleSlider.value);
      const rad = ((angle - 90) * Math.PI) / 180;
      const x1 = w / 2 - (Math.cos(rad) * w) / 2;
      const y1 = h / 2 - (Math.sin(rad) * h) / 2;
      const x2 = w / 2 + (Math.cos(rad) * w) / 2;
      const y2 = h / 2 + (Math.sin(rad) * h) / 2;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      for (const s of sorted) grad.addColorStop(s.position / 100, s.color);
      ctx.fillStyle = grad;
    }

    ctx.fillRect(0, 0, w, h);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[Inztun] gradient-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('PNG downloaded (1920×1080)');
      logToolAction('css-gradient', 'Downloaded gradient PNG');
    }, 'image/png');
  }

  destroy(): void {}
}

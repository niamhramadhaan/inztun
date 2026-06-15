import { Toast } from '../../../components/Toast';

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
        </div>
        <pre class="input input--textarea" id="dsg-output" style="min-height:60px;cursor:text;"></pre>
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
      navigator.clipboard.writeText(this.outputEl.textContent || '');
      Toast.copied('CSS');
    });

    this.renderStops();
    this.update();
  }

  private renderStops(): void {
    this.stopsContainer.innerHTML = this.stops.map((stop, i) => `
      <div class="dsg-stop">
        <input type="color" value="${stop.color}" class="dsg-stop__color" data-i="${i}">
        <input type="range" min="0" max="100" value="${stop.position}" class="dsg-stop__pos password-slider" data-i="${i}">
        <span class="dsg-stop__val">${stop.position}%</span>
        ${this.stops.length > 2 ? `<button class="btn btn--ghost btn--sm dsg-stop__remove" data-i="${i}">×</button>` : ''}
      </div>
    `).join('');

    this.stopsContainer.querySelectorAll('.dsg-stop__color').forEach(el => {
      el.addEventListener('input', (e) => {
        const i = parseInt((e.target as HTMLElement).dataset.i!);
        this.stops[i].color = (e.target as HTMLInputElement).value;
        this.update();
      });
    });

    this.stopsContainer.querySelectorAll('.dsg-stop__pos').forEach(el => {
      el.addEventListener('input', (e) => {
        const i = parseInt((e.target as HTMLElement).dataset.i!);
        this.stops[i].position = parseInt((e.target as HTMLInputElement).value);
        (e.target as HTMLElement).closest('.dsg-stop')!.querySelector('.dsg-stop__val')!.textContent = this.stops[i].position + '%';
        this.update();
      });
    });

    this.stopsContainer.querySelectorAll('.dsg-stop__remove').forEach(el => {
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
    const stopsStr = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
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

  destroy(): void {}
}

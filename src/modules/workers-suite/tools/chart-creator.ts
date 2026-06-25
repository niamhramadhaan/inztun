import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { ICONS } from '../../../core/icons';
import type { Tool } from '../../../types';

interface ChartData {
  labels: string[];
  series: { name: string; values: number[] }[];
}

const COLOR_SCHEMES = [
  { name: 'Default', colors: ['#c9a96e', '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'] },
  { name: 'Ocean', colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16'] },
  { name: 'Sunset', colors: ['#f97316', '#f59e0b', '#eab308', '#ef4444', '#ec4899', '#d946ef'] },
  {
    name: 'Monochrome',
    colors: ['#1a1a1a', '#333333', '#555555', '#777777', '#999999', '#bbbbbb'],
  },
  { name: 'Pastel', colors: ['#93c5fd', '#a5b4fc', '#c4b5fd', '#f0abfc', '#fda4af', '#fcd34d'] },
  { name: 'Neon', colors: ['#00ff88', '#00ccff', '#ff00cc', '#ffcc00', '#ff4444', '#88ff00'] },
];

const CHART_TYPES = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'pie', label: 'Pie' },
  { id: 'doughnut', label: 'Doughnut' },
];

function parseInput(text: string): ChartData | null {
  const lines = text
    .trim()
    .split('\n')
    .filter((l) => l.trim());
  if (lines.length < 2) return null;

  const isMarkdown = lines[0].includes('|');
  const delimiter = isMarkdown ? '|' : lines[0].includes('\t') ? '\t' : ',';

  const splitLine = (line: string): string[] => {
    if (isMarkdown)
      return line
        .split('|')
        .map((c) => c.trim())
        .filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));
    return line.split(delimiter).map((c) => c.trim());
  };

  const headers = splitLine(lines[0]);
  if (headers.length < 2) return null;

  // Skip separator row
  let dataStart = 1;
  if (lines[1] && /^[\s|:-]+$/.test(lines[1])) dataStart = 2;

  const labels: string[] = [];
  const valueArrays: number[][] = headers.slice(1).map(() => []);

  for (let i = dataStart; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    if (cells.length < 2) continue;
    labels.push(cells[0]);
    for (let j = 1; j < headers.length; j++) {
      const val = parseFloat(cells[j]?.replace(/,/g, '') || '0');
      valueArrays[j - 1].push(isNaN(val) ? 0 : val);
    }
  }

  if (labels.length === 0) return null;

  return {
    labels,
    series: headers.slice(1).map((name, i) => ({ name, values: valueArrays[i] })),
  };
}

function drawBarChart(
  ctx: CanvasRenderingContext2D,
  data: ChartData,
  colors: string[],
  W: number,
  H: number,
  title: string,
  showLegend: boolean,
): void {
  const pad = { top: 60, right: 30, bottom: 60, left: 60 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const n = data.labels.length;
  const numSeries = data.series.length;
  const groupWidth = chartW / n;
  const barWidth = Math.min((groupWidth * 0.7) / numSeries, 40);
  const groupPad = (groupWidth - barWidth * numSeries) / 2;

  const maxVal = Math.max(...data.series.flatMap((s) => s.values), 1);
  const niceMax = Math.ceil(maxVal / 10) * 10;
  const ySteps = 5;

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, W, H);

  // Title
  if (title) {
    ctx.fillStyle = '#f5f5f5';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 30);
  }

  // Grid lines
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  for (let i = 0; i <= ySteps; i++) {
    const y = pad.top + (chartH / ySteps) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();

    ctx.fillStyle = '#888888';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(niceMax - (niceMax / ySteps) * i)), pad.left - 8, y + 4);
  }

  // Bars
  for (let s = 0; s < numSeries; s++) {
    ctx.fillStyle = colors[s % colors.length];
    for (let i = 0; i < n; i++) {
      const x = pad.left + groupWidth * i + groupPad + barWidth * s;
      const barH = (data.series[s].values[i] / niceMax) * chartH;
      const y = pad.top + chartH - barH;
      ctx.fillRect(x, y, barWidth, barH);
    }
  }

  // X labels
  ctx.fillStyle = '#888888';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const x = pad.left + groupWidth * i + groupWidth / 2;
    ctx.fillText(data.labels[i], x, H - pad.bottom + 20);
  }

  // Legend
  if (showLegend && numSeries > 1)
    drawLegend(
      ctx,
      data.series.map((s) => s.name),
      colors,
      W,
      H,
    );
}

function drawLineChart(
  ctx: CanvasRenderingContext2D,
  data: ChartData,
  colors: string[],
  W: number,
  H: number,
  title: string,
  showLegend: boolean,
): void {
  const pad = { top: 60, right: 30, bottom: 60, left: 60 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const n = data.labels.length;

  const maxVal = Math.max(...data.series.flatMap((s) => s.values), 1);
  const niceMax = Math.ceil(maxVal / 10) * 10;
  const ySteps = 5;

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, W, H);

  if (title) {
    ctx.fillStyle = '#f5f5f5';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 30);
  }

  // Grid
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  for (let i = 0; i <= ySteps; i++) {
    const y = pad.top + (chartH / ySteps) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();

    ctx.fillStyle = '#888888';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(niceMax - (niceMax / ySteps) * i)), pad.left - 8, y + 4);
  }

  // Lines
  for (let s = 0; s < data.series.length; s++) {
    const color = colors[s % colors.length];
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let i = 0; i < n; i++) {
      const x = pad.left + (chartW / (n - 1 || 1)) * i;
      const y = pad.top + chartH - (data.series[s].values[i] / niceMax) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Points
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const x = pad.left + (chartW / (n - 1 || 1)) * i;
      const y = pad.top + chartH - (data.series[s].values[i] / niceMax) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // X labels
  ctx.fillStyle = '#888888';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const x = pad.left + (chartW / (n - 1 || 1)) * i;
    ctx.fillText(data.labels[i], x, H - pad.bottom + 20);
  }

  if (showLegend && data.series.length > 1)
    drawLegend(
      ctx,
      data.series.map((s) => s.name),
      colors,
      W,
      H,
    );
}

function drawPieChart(
  ctx: CanvasRenderingContext2D,
  data: ChartData,
  colors: string[],
  W: number,
  H: number,
  title: string,
  showLegend: boolean,
  doughnut: boolean,
): void {
  const values = data.series[0].values;
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const n = data.labels.length;

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, W, H);

  if (title) {
    ctx.fillStyle = '#f5f5f5';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 30);
  }

  const cx = W / 2;
  const cy = H / 2 + 10;
  const r = Math.min(W, H) / 2 - 80;
  const innerR = doughnut ? r * 0.55 : 0;

  let startAngle = -Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const sliceAngle = (values[i] / total) * Math.PI * 2;
    const midAngle = startAngle + sliceAngle / 2;
    const color = colors[i % colors.length];

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    if (doughnut) {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, innerR, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
    }

    // Percentage label
    const pct = ((values[i] / total) * 100).toFixed(1);
    if (parseFloat(pct) > 3) {
      const labelR = doughnut ? (r + innerR) / 2 : r * 0.7;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${pct}%`, lx, ly);
    }

    startAngle += sliceAngle;
  }

  // Center label for doughnut
  if (doughnut) {
    ctx.fillStyle = '#f5f5f5';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(total)), cx, cy);
  }

  if (showLegend) drawLegend(ctx, data.labels, colors, W, H);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  labels: string[],
  colors: string[],
  W: number,
  H: number,
): void {
  const x = 20;
  let y = H - 30 - labels.length * 20;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < labels.length; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x, y - 5, 12, 12);
    ctx.fillStyle = '#cccccc';
    ctx.fillText(labels[i], x + 18, y + 1);
    y += 20;
  }
}

export class ChartCreator implements Tool {
  id = 'chart-creator';
  name = 'Chart Creator';
  icon = ICONS.chart;

  private chartType: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
  private schemeIdx = 0;
  private showLegend = true;
  private chartTitle = '';
  private data: ChartData | null = null;
  private scale = 2;

  render(): string {
    return `
      <div class="tool-area">
        <div class="cc-layout">
          <div class="cc-controls">
            <div class="form-group">
              <label class="label">Data (Markdown table or CSV)</label>
              <textarea class="input input--textarea" id="cc-input" placeholder="Label, Value1, Value2\nJan, 100, 200\nFeb, 150, 180\nMar, 120, 220" spellcheck="false" style="min-height:120px;"></textarea>
            </div>
            <div class="form-group">
              <label class="label">Chart Type</label>
              <div class="cc-chart-types" id="cc-chart-types">
                ${CHART_TYPES.map((t) => `<button class="btn btn--ghost btn--sm ${t.id === 'bar' ? 'cc-type--active' : ''}" data-type="${t.id}">${t.label}</button>`).join('')}
              </div>
            </div>
            <div class="form-group">
              <label class="label">Color Scheme</label>
              <div class="cc-schemes" id="cc-schemes">
                ${COLOR_SCHEMES.map(
                  (s, i) => `
                  <button class="btn btn--ghost btn--sm cc-scheme-btn ${i === 0 ? 'cc-scheme--active' : ''}" data-i="${i}">
                    ${s.colors
                      .slice(0, 3)
                      .map((c) => `<span class="cc-scheme-dot" style="background:${c}"></span>`)
                      .join('')}
                    ${s.name}
                  </button>
                `,
                ).join('')}
              </div>
            </div>
            <div class="form-group">
              <label class="label">Title</label>
              <input type="text" class="input" id="cc-title" placeholder="Chart title">
            </div>
            <div class="form-group">
              <label class="label"><input type="checkbox" id="cc-legend" checked> Show Legend</label>
            </div>
            <div class="form-group">
              <label class="label">Resolution</label>
              <select class="input" id="cc-scale">
                <option value="1">1x</option>
                <option value="2" selected>2x</option>
              </select>
            </div>
            <div class="tool-actions">
              <button class="btn btn--primary" id="cc-render">Render</button>
              <button class="btn btn--ghost" id="cc-download">PNG</button>
            </div>
          </div>
          <div class="cc-preview">
            <canvas id="cc-canvas" width="800" height="500" class="cc-canvas"></canvas>
            <div class="cc-data-preview" id="cc-data-preview"></div>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const canvas = root.querySelector('#cc-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const inputEl = root.querySelector('#cc-input') as HTMLTextAreaElement;
    const titleEl = root.querySelector('#cc-title') as HTMLInputElement;
    const legendEl = root.querySelector('#cc-legend') as HTMLInputElement;
    const scaleEl = root.querySelector('#cc-scale') as HTMLSelectElement;
    const dataPreview = root.querySelector('#cc-data-preview')!;

    inputEl.addEventListener('input', () => {});
    titleEl.addEventListener('input', () => {
      this.chartTitle = titleEl.value;
    });
    legendEl.addEventListener('change', () => {
      this.showLegend = legendEl.checked;
    });
    scaleEl.addEventListener('change', () => {
      this.scale = parseInt(scaleEl.value);
    });

    root.querySelectorAll('#cc-chart-types .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('#cc-chart-types .btn')
          .forEach((b) => b.classList.remove('cc-type--active'));
        btn.classList.add('cc-type--active');
        this.chartType = (btn as HTMLElement).dataset.type as 'bar' | 'line' | 'pie' | 'doughnut';
      });
    });

    root.querySelectorAll('#cc-schemes .cc-scheme-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('#cc-schemes .cc-scheme-btn')
          .forEach((b) => b.classList.remove('cc-scheme--active'));
        btn.classList.add('cc-scheme--active');
        this.schemeIdx = parseInt((btn as HTMLElement).dataset.i!);
      });
    });

    root.querySelector('#cc-render')!.addEventListener('click', () => {
      this.data = parseInput(inputEl.value);
      if (!this.data) {
        Toast.error('Could not parse data');
        return;
      }
      this.renderChart(canvas, ctx);
      this.renderDataPreview(dataPreview);
      Toast.success(`Rendered ${this.data.labels.length} data points`);
      logToolAction('chart-creator', `Rendered ${this.chartType} chart`);
    });

    root.querySelector('#cc-download')!.addEventListener('click', () => this.download(canvas));

    // Sample data
    inputEl.value =
      'Month, Revenue, Expenses\nJan, 4500, 3200\nFeb, 5200, 3800\nMar, 4800, 3500\nApr, 6100, 4200\nMay, 5800, 3900\nJun, 7200, 4500';
    this.data = parseInput(inputEl.value);
    if (this.data) {
      this.renderChart(canvas, ctx);
      this.renderDataPreview(dataPreview);
    }
  }

  private renderChart(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    if (!this.data) return;
    const colors = COLOR_SCHEMES[this.schemeIdx].colors;

    switch (this.chartType) {
      case 'bar':
        drawBarChart(
          ctx,
          this.data,
          colors,
          canvas.width,
          canvas.height,
          this.chartTitle,
          this.showLegend,
        );
        break;
      case 'line':
        drawLineChart(
          ctx,
          this.data,
          colors,
          canvas.width,
          canvas.height,
          this.chartTitle,
          this.showLegend,
        );
        break;
      case 'pie':
        drawPieChart(
          ctx,
          this.data,
          colors,
          canvas.width,
          canvas.height,
          this.chartTitle,
          this.showLegend,
          false,
        );
        break;
      case 'doughnut':
        drawPieChart(
          ctx,
          this.data,
          colors,
          canvas.width,
          canvas.height,
          this.chartTitle,
          this.showLegend,
          true,
        );
        break;
    }
  }

  private renderDataPreview(el: Element): void {
    if (!this.data) return;
    let html = '<div class="cc-data-scroll"><table class="cc-data-table"><thead><tr>';
    html += `<th>${this.data.labels.length} items</th>`;
    this.data.series.forEach((s) => {
      html += `<th>${s.name}</th>`;
    });
    html += '</tr></thead><tbody>';
    this.data.labels.forEach((label, i) => {
      html += `<tr><td>${label}</td>`;
      this.data!.series.forEach((s) => {
        html += `<td>${s.values[i]}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  private download(canvas: HTMLCanvasElement): void {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width * this.scale;
    exportCanvas.height = canvas.height * this.scale;
    const ctx = exportCanvas.getContext('2d')!;
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(canvas, 0, 0);

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[Inztun] chart-${this.chartType}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('PNG downloaded');
      logToolAction('chart-creator', 'Downloaded chart PNG');
    }, 'image/png');
  }

  destroy(): void {}
}

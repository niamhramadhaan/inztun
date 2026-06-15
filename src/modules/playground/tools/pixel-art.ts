import { Toast } from '../../../components/Toast';

const PALETTE = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
  '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#0088ff', '#88ff00',
  '#ff0088', '#008800', '#880000', '#888888',
];

export class PixelArt {
  id = 'pixel-art';
  name = 'Pixel Art Editor';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="4" height="4"/>
      <rect x="10" y="3" width="4" height="4"/>
      <rect x="17" y="3" width="4" height="4"/>
      <rect x="3" y="10" width="4" height="4"/>
      <rect x="10" y="10" width="4" height="4" fill="currentColor"/>
      <rect x="17" y="10" width="4" height="4"/>
      <rect x="3" y="17" width="4" height="4"/>
      <rect x="10" y="17" width="4" height="4"/>
      <rect x="17" y="17" width="4" height="4"/>
    </svg>`;

  private gridSize = 16;
  private cellSize = 20;
  private color = '#000000';
  private tool: 'pencil' | 'eraser' | 'fill' = 'pencil';
  private pixels: string[][] = [];
  private isDrawing = false;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private undoStack: string[][][] = [];
  private showGrid = true;

  render(): string {
    return `
      <div class="tool-area">
        <div class="px-controls">
          <div class="form-group">
            <label class="label">Grid Size</label>
            <select class="input" id="px-size" style="width:auto;">
              <option value="16" selected>16 × 16</option>
              <option value="32">32 × 32</option>
              <option value="64">64 × 64</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Tool</label>
            <div class="px-tools" id="px-tools">
              <button class="px-tool px-tool--active" data-tool="pencil" title="Pencil">✏️</button>
              <button class="px-tool" data-tool="eraser" title="Eraser">🧹</button>
              <button class="px-tool" data-tool="fill" title="Fill">🪣</button>
            </div>
          </div>
          <div class="form-group">
            <label class="label">Color</label>
            <div class="px-palette" id="px-palette">
              ${PALETTE.map(c => `<button class="px-swatch${c === '#000000' ? ' px-swatch--active' : ''}" data-color="${c}" style="background:${c};"></button>`).join('')}
              <input type="color" id="px-custom" value="#000000" class="px-custom-color">
            </div>
          </div>
          <div class="form-group">
            <label class="checkbox-label"><input type="checkbox" id="px-grid" checked> Show Grid</label>
          </div>
        </div>
        <div class="px-canvas-wrap">
          <canvas id="px-canvas"></canvas>
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="px-undo">Undo</button>
          <button class="btn btn--ghost" id="px-clear">Clear</button>
          <button class="btn btn--primary" id="px-export">Export PNG</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.canvas = root.querySelector('#px-canvas')!;
    this.ctx = this.canvas.getContext('2d')!;
    this.initGrid();

    const sizeSelect = root.querySelector('#px-size') as HTMLSelectElement;
    sizeSelect.addEventListener('change', () => {
      this.gridSize = parseInt(sizeSelect.value);
      this.cellSize = this.gridSize === 64 ? 10 : this.gridSize === 32 ? 16 : 20;
      this.initGrid();
      this.draw();
    });

    root.querySelectorAll('.px-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.px-tool').forEach(b => b.classList.remove('px-tool--active'));
        btn.classList.add('px-tool--active');
        this.tool = (btn as HTMLElement).dataset.tool as typeof this.tool;
      });
    });

    root.querySelectorAll('.px-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.px-swatch').forEach(b => b.classList.remove('px-swatch--active'));
        btn.classList.add('px-swatch--active');
        this.color = (btn as HTMLElement).dataset.color!;
      });
    });

    const customColor = root.querySelector('#px-custom') as HTMLInputElement;
    customColor.addEventListener('input', () => {
      this.color = customColor.value;
      root.querySelectorAll('.px-swatch').forEach(b => b.classList.remove('px-swatch--active'));
    });

    const gridToggle = root.querySelector('#px-grid') as HTMLInputElement;
    gridToggle.addEventListener('change', () => { this.showGrid = gridToggle.checked; this.draw(); });

    this.canvas.addEventListener('mousedown', (e) => { this.isDrawing = true; this.handleDraw(e); });
    this.canvas.addEventListener('mousemove', (e) => { if (this.isDrawing) this.handleDraw(e); });
    this.canvas.addEventListener('mouseup', () => { this.isDrawing = false; });
    this.canvas.addEventListener('mouseleave', () => { this.isDrawing = false; });

    root.querySelector('#px-undo')!.addEventListener('click', () => this.undo());
    root.querySelector('#px-clear')!.addEventListener('click', () => { this.saveUndo(); this.initGrid(); this.draw(); });
    root.querySelector('#px-export')!.addEventListener('click', () => this.exportPng());
  }

  private initGrid(): void {
    this.pixels = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(''));
    this.canvas.width = this.gridSize * this.cellSize;
    this.canvas.height = this.gridSize * this.cellSize;
    this.undoStack = [];
    this.draw();
  }

  private draw(): void {
    const size = this.gridSize * this.cellSize;
    this.ctx.clearRect(0, 0, size, size);
    this.ctx.fillStyle = '#f8f8f8';
    this.ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.pixels[y][x]) {
          this.ctx.fillStyle = this.pixels[y][x];
          this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }

    if (this.showGrid) {
      this.ctx.strokeStyle = '#e0e0e0';
      this.ctx.lineWidth = 0.5;
      for (let i = 0; i <= this.gridSize; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(i * this.cellSize, 0);
        this.ctx.lineTo(i * this.cellSize, size);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(0, i * this.cellSize);
        this.ctx.lineTo(size, i * this.cellSize);
        this.ctx.stroke();
      }
    }
  }

  private handleDraw(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.cellSize);
    const y = Math.floor((e.clientY - rect.top) / this.cellSize);
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return;

    if (this.tool === 'pencil') {
      if (this.pixels[y][x] !== this.color) this.saveUndo();
      this.pixels[y][x] = this.color;
    } else if (this.tool === 'eraser') {
      if (this.pixels[y][x]) this.saveUndo();
      this.pixels[y][x] = '';
    } else if (this.tool === 'fill') {
      this.saveUndo();
      this.floodFill(x, y, this.pixels[y][x], this.color);
    }
    this.draw();
  }

  private floodFill(x: number, y: number, target: string, replacement: string): void {
    if (target === replacement) return;
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return;
    if (this.pixels[y][x] !== target) return;
    this.pixels[y][x] = replacement;
    this.floodFill(x + 1, y, target, replacement);
    this.floodFill(x - 1, y, target, replacement);
    this.floodFill(x, y + 1, target, replacement);
    this.floodFill(x, y - 1, target, replacement);
  }

  private saveUndo(): void {
    this.undoStack.push(this.pixels.map(row => [...row]));
    if (this.undoStack.length > 30) this.undoStack.shift();
  }

  private undo(): void {
    if (this.undoStack.length === 0) return;
    this.pixels = this.undoStack.pop()!;
    this.draw();
  }

  private exportPng(): void {
    const scale = Math.max(1, Math.floor(512 / this.gridSize));
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.gridSize * scale;
    exportCanvas.height = this.gridSize * scale;
    const ctx = exportCanvas.getContext('2d')!;

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.pixels[y][x]) {
          ctx.fillStyle = this.pixels[y][x];
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `pixel-art-${this.gridSize}x${this.gridSize}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      Toast.success('Exported');
    }, 'image/png');
  }

  destroy(): void {}
}

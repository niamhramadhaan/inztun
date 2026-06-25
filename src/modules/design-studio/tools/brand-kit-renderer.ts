export interface BrandData {
  name: string;
  tagline: string;
  logoDataUrl: string;
  colors: string[];
  fonts: { heading: string; body: string };
}

export interface PanelBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const BOARD = {
  width: 1920,
  height: 1440,
  padding: 40,
  gutter: 20,
  panelW: 600,
  panelH: 440,
  bg: '#0a0a0a',
  panelBg: '#141414',
  panelBorder: '#222222',
  textPrimary: '#f5f5f5',
  textSecondary: '#888888',
  textMuted: '#555555',
  accent: '#c9a96e',
} as const;

export function panelAt(row: number, col: number): PanelBounds {
  return {
    x: BOARD.padding + col * (BOARD.panelW + BOARD.gutter),
    y: BOARD.padding + row * (BOARD.panelH + BOARD.gutter),
    w: BOARD.panelW,
    h: BOARD.panelH,
  };
}

export function drawPanelBase(
  ctx: CanvasRenderingContext2D,
  p: PanelBounds,
  label: string,
  pageNum: number,
): void {
  ctx.fillStyle = BOARD.panelBg;
  roundRect(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.fill();
  ctx.strokeStyle = BOARD.panelBorder;
  ctx.lineWidth = 1;
  roundRect(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.stroke();

  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = BOARD.textMuted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label.toUpperCase(), p.x + 20, p.y + 16);
  ctx.textAlign = 'right';
  ctx.fillText(String(pageNum).padStart(2, '0'), p.x + p.w - 20, p.y + 16);
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawLogoPlaceholder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.15);
  ctx.lineTo(cx, cy + size * 0.15);
  ctx.moveTo(cx - size * 0.15, cy);
  ctx.lineTo(cx + size * 0.15, cy);
  ctx.stroke();
}

export function drawSwatchRow(
  ctx: CanvasRenderingContext2D,
  colors: string[],
  x: number,
  y: number,
  swatchSize: number,
  gap: number,
): void {
  colors.forEach((c, i) => {
    const sx = x + i * (swatchSize + gap);
    ctx.fillStyle = c;
    roundRect(ctx, sx, y, swatchSize, swatchSize, 6);
    ctx.fill();
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = BOARD.textMuted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(c.toUpperCase(), sx + swatchSize / 2, y + swatchSize + 8);
  });
}

export function drawBrowserMockup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
): void {
  const barH = 32;
  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#222222';
  roundRect(ctx, x, y, w, barH, 8);
  ctx.fill();
  ctx.fillRect(x, y + barH - 8, w, 8);

  const dotY = y + barH / 2;
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(x + 16 + i * 14, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });

  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, x + 60, y + 8, w - 80, 16, 4);
  ctx.fill();
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = BOARD.textMuted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('brand.dev', x + w / 2, y + barH / 2);

  ctx.fillStyle = accent + '15';
  ctx.fillRect(x + 1, y + barH + 1, w - 2, h - barH - 2);
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  border: string,
): void {
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();
}

export function drawCheckCross(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  good: boolean,
): void {
  ctx.strokeStyle = good ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, Math.PI * 2);
  ctx.stroke();
  if (good) {
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.4, cy);
    ctx.lineTo(cx - size * 0.1, cy + size * 0.3);
    ctx.lineTo(cx + size * 0.4, cy - size * 0.3);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.3, cy - size * 0.3);
    ctx.lineTo(cx + size * 0.3, cy + size * 0.3);
    ctx.moveTo(cx + size * 0.3, cy - size * 0.3);
    ctx.lineTo(cx - size * 0.3, cy + size * 0.3);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

export function drawConstructionGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  divisions: number,
): void {
  ctx.strokeStyle = BOARD.textMuted + '30';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= divisions; i++) {
    const pos = i / divisions;
    ctx.beginPath();
    ctx.moveTo(x + pos * size, y);
    ctx.lineTo(x + pos * size, y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + pos * size);
    ctx.lineTo(x + size, y + pos * size);
    ctx.stroke();
  }
  ctx.strokeStyle = BOARD.textMuted + '50';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size / 2, y + size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + size / 2);
  ctx.lineTo(x + size, y + size / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function hexToHsl(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  const rN = r / 255,
    gN = g / 255,
    bN = b / 255;
  const max = Math.max(rN, gN, bN),
    min = Math.min(rN, gN, bN);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rN) h = ((gN - bN) / d + (gN < bN ? 6 : 0)) / 6;
    else if (max === gN) h = ((bN - rN) / d + 2) / 6;
    else h = ((rN - gN) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateHarmony(
  hex: string,
  type: 'analogous' | 'complementary' | 'triadic' | 'split' | 'monochromatic',
): string[] {
  const [h, s, l] = hexToHsl(hex);
  switch (type) {
    case 'analogous':
      return [hslToHex((h - 30 + 360) % 360, s, l), hex, hslToHex((h + 30) % 360, s, l)];
    case 'complementary':
      return [hex, hslToHex((h + 180) % 360, s, l)];
    case 'triadic':
      return [hex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
    case 'split':
      return [hex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
    case 'monochromatic':
      return [0.2, 0.35, 0.5, 0.65, 0.8].map((lt) => hslToHex(h, s, Math.round(lt * 100)));
  }
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

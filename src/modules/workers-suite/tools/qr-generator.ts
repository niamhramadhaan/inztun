import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { ICONS } from '../../../core/icons';
import type { Tool } from '../../../types';

// ── Galois Field GF(256) ──
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function gfPolyMul(p: number[], q: number[]): number[] {
  const r = new Array(p.length + q.length - 1).fill(0);
  for (let i = 0; i < p.length; i++)
    for (let j = 0; j < q.length; j++) r[i + j] ^= gfMul(p[i], q[j]);
  return r;
}

function rsGeneratorPoly(ecLen: number): number[] {
  let g = [1];
  for (let i = 0; i < ecLen; i++) g = gfPolyMul(g, [1, GF_EXP[i]]);
  return g;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen);
  const msg = new Array(data.length + ecLen).fill(0);
  for (let i = 0; i < data.length; i++) msg[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) msg[i + j] ^= gfMul(gen[j], coef);
    }
  }
  return msg.slice(data.length);
}

// ── QR Version info ──
const EC_CODEWORDS_PER_BLOCK = [
  [
    0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30,
    30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  [
    0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 28, 30, 24, 30,
    30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 22, 26, 28, 26, 26, 26, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
];

const DATA_CODEWORDS = [
  [
    0, 19, 34, 55, 80, 108, 136, 156, 194, 232, 274, 324, 370, 428, 461, 523, 589, 647, 721, 795,
    861, 932, 1006, 1094, 1174, 1276, 1370, 1468, 1531, 1631, 1735, 1843, 1955, 2071, 2191, 2306,
    2434, 2566, 2702, 2812, 2956,
  ],
  [
    0, 16, 28, 44, 64, 86, 108, 124, 154, 182, 216, 254, 290, 334, 365, 415, 453, 507, 563, 627,
    669, 714, 782, 860, 914, 1000, 1062, 1128, 1193, 1267, 1373, 1455, 1541, 1631, 1725, 1812, 1914,
    1992, 2102, 2216, 2334,
  ],
];

const ALIGNMENT_PATTERNS = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

const FORMAT_INFO_BITS = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0, 0x77c4, 0x72f3, 0x7daa, 0x789d,
  0x662f, 0x6318, 0x6c41, 0x6976, 0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b,
  0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed,
];

const NUM_ERROR_CORRECTION_BLOCKS = [
  [
    0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14,
    15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  [
    0, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25,
    26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49, 51,
  ],
  [
    0, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34,
    35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  [
    0, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37,
    40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
];

interface QRCode {
  modules: boolean[][];
  size: number;
}

function getDataCodewords(data: string, version: number): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    if (code < 128) bytes.push(code);
    else if (code < 2048) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    }
  }

  const capacity = DATA_CODEWORDS[0][version];
  const bits: number[] = [];

  // Mode indicator (byte mode = 0100)
  bits.push(0, 1, 0, 0);

  // Character count
  const ccBits = version <= 9 ? 8 : 16;
  const len = bytes.length;
  for (let i = ccBits - 1; i >= 0; i--) bits.push((len >> i) & 1);

  // Data
  for (const b of bytes) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);

  // Terminator
  const totalBits = capacity * 8;
  for (let i = 0; i < 4 && bits.length < totalBits; i++) bits.push(0);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad codewords
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalBits) {
    const pb = padBytes[padIdx % 2];
    for (let i = 7; i >= 0; i--) bits.push((pb >> i) & 1);
    padIdx++;
  }

  // Convert to codewords
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) val = (val << 1) | (bits[i + j] || 0);
    codewords.push(val);
  }

  return codewords;
}

function addErrorCorrection(data: number[], version: number, ecLevel: number): number[] {
  const ecPerBlock = EC_CODEWORDS_PER_BLOCK[ecLevel][version];
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecLevel][version];
  const totalDataCodewords = data.length;
  const blockSize = Math.floor(totalDataCodewords / numBlocks);
  const longBlocks = totalDataCodewords - blockSize * numBlocks;

  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;

  for (let i = 0; i < numBlocks; i++) {
    const bs = blockSize + (i >= numBlocks - longBlocks ? 1 : 0);
    blocks.push(data.slice(offset, offset + bs));
    ecBlocks.push(rsEncode(data.slice(offset, offset + bs), ecPerBlock));
    offset += bs;
  }

  const result: number[] = [];
  const maxBlockSize = blockSize + (longBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxBlockSize; i++) {
    for (let j = 0; j < numBlocks; j++) {
      if (i < blocks[j].length) result.push(blocks[j][i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let j = 0; j < numBlocks; j++) result.push(ecBlocks[j][i]);
  }

  return result;
}

function getMinVersion(dataLen: number, ecLevel: number): number {
  for (let v = 1; v <= 40; v++) {
    const capacity = DATA_CODEWORDS[ecLevel][v];
    const ecPerBlock = EC_CODEWORDS_PER_BLOCK[ecLevel][v];
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecLevel][v];
    const dataCapacity = capacity - ecPerBlock * numBlocks;
    // byte mode overhead: 4 bit mode + 8/16 bit count
    const overhead = v <= 9 ? 12 : 20;
    const maxBytes = Math.floor((dataCapacity * 8 - overhead) / 8);
    if (dataLen <= maxBytes) return v;
  }
  return -1;
}

function createMatrix(version: number): { modules: boolean[][]; reserved: boolean[][] } {
  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns
  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r,
          cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const inSep = r === -1 || r === 7 || c === -1 || c === 7;
        modules[rr][cc] = !inSep && (inOuter || inInner);
        reserved[rr][cc] = true;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    reserved[6][i] = true;
    modules[i][6] = i % 2 === 0;
    reserved[i][6] = true;
  }

  // Alignment patterns
  if (version >= 2) {
    const positions = ALIGNMENT_PATTERNS[version];
    for (const row of positions) {
      for (const col of positions) {
        if (reserved[row][col]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const inOuter = r === -2 || r === 2 || c === -2 || c === 2;
            const inCenter = r === 0 && c === 0;
            modules[row + r][col + c] = inOuter || inCenter;
            reserved[row + r][col + c] = true;
          }
        }
      }
    }
  }

  // Dark module
  modules[size - 8][8] = true;
  reserved[size - 8][8] = true;

  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    reserved[8][i] = true;
    reserved[8][size - 1 - i] = true;
    reserved[i][8] = true;
    reserved[size - 1 - i][8] = true;
  }
  reserved[8][8] = true;

  // Reserve version info areas
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserved[i][size - 11 + j] = true;
        reserved[size - 11 + j][i] = true;
      }
    }
  }

  return { modules, reserved };
}

function placeData(modules: boolean[][], reserved: boolean[][], data: number[]): void {
  const size = modules.length;
  const bits: number[] = [];
  for (const byte of data) for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);

  let bitIdx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? size - 1 - vert : vert;
        if (!reserved[row][col] && bitIdx < bits.length) {
          modules[row][col] = bits[bitIdx] === 1;
          bitIdx++;
        }
      }
    }
  }
}

function getMaskFn(mask: number): (r: number, c: number) => boolean {
  switch (mask) {
    case 0:
      return (r, c) => (r + c) % 2 === 0;
    case 1:
      return (r) => r % 2 === 0;
    case 2:
      return (_, c) => c % 3 === 0;
    case 3:
      return (r, c) => (r + c) % 3 === 0;
    case 4:
      return (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7:
      return (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default:
      return () => false;
  }
}

function applyMask(modules: boolean[][], reserved: boolean[][], mask: number): boolean[][] {
  const size = modules.length;
  const result = modules.map((r) => [...r]);
  const fn = getMaskFn(mask);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (!reserved[r][c] && fn(r, c)) result[r][c] = !result[r][c];
  return result;
}

function placeFormatInfo(modules: boolean[][], ecLevel: number, mask: number): void {
  const size = modules.length;
  const bits = FORMAT_INFO_BITS[ecLevel * 8 + mask];

  for (let i = 0; i < 15; i++) {
    const bit = (bits >> i) & 1;
    // Top-left
    if (i < 6) {
      modules[i][8] = !!bit;
      modules[8][size - 1 - i] = !!bit;
    } else if (i === 6) {
      modules[7][8] = !!bit;
      modules[8][size - 7] = !!bit;
    } else if (i === 7) {
      modules[8][8] = !!bit;
      modules[8][size - 8] = !!bit;
    } else {
      modules[8][size - 15 + i] = !!bit;
      modules[14 - i][8] = !!bit;
    }
  }
}

function calculatePenalty(modules: boolean[][]): number {
  const size = modules.length;
  let penalty = 0;

  // Rule 1: runs of same color
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (modules[r][c] === modules[r][c - 1]) {
        run++;
        if (run === 5) penalty += 3;
        else if (run > 5) penalty++;
      } else run = 1;
    }
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (modules[r][c] === modules[r - 1][c]) {
        run++;
        if (run === 5) penalty += 3;
        else if (run > 5) penalty++;
      } else run = 1;
    }
  }

  return penalty;
}

function generateQR(text: string, ecLevel: number): QRCode {
  if (!text) return { modules: [[false]], size: 1 };

  const version = getMinVersion(text.length, ecLevel);
  if (version < 0) throw new Error('Data too long');

  const dataCodewords = getDataCodewords(text, version);
  const allCodewords = addErrorCorrection(dataCodewords, version, ecLevel);

  let bestModules: boolean[][] = [];
  let bestSize = 0;
  let bestPenalty = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const { modules, reserved } = createMatrix(version);
    placeData(modules, reserved, allCodewords);
    const masked = applyMask(modules, reserved, mask);
    placeFormatInfo(masked, ecLevel, mask);

    const penalty = calculatePenalty(masked);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestModules = masked;
      bestSize = version * 4 + 17;
    }
  }

  return { modules: bestModules, size: bestSize };
}

function renderToCanvas(qr: QRCode, canvas: HTMLCanvasElement, fg: string, bg: string): void {
  const quiet = 4;
  const totalSize = qr.size + quiet * 2;
  const cellSize = canvas.width / totalSize;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = fg;
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) {
        ctx.fillRect((c + quiet) * cellSize, (r + quiet) * cellSize, cellSize, cellSize);
      }
    }
  }
}

function qrToSVG(qr: QRCode, fg: string, bg: string): string {
  const quiet = 4;
  const totalSize = qr.size + quiet * 2;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="${bg}"/>`;
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c])
        svg += `<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1" fill="${fg}"/>`;
    }
  }
  svg += '</svg>';
  return svg;
}

const EC_LEVELS = [
  { label: 'L (7%)', value: 0 },
  { label: 'M (15%)', value: 1 },
  { label: 'Q (25%)', value: 2 },
  { label: 'H (30%)', value: 3 },
];

const SIZES = [
  { label: '256px', value: 256 },
  { label: '512px', value: 512 },
  { label: '1024px', value: 1024 },
];

export class QrGenerator implements Tool {
  id = 'qr-generator';
  name = 'QR Code Generator';
  icon = ICONS.qrCode;

  private text = '';
  private ecLevel = 1;
  private exportSize = 512;
  private fgColor = '#000000';
  private bgColor = '#ffffff';

  render(): string {
    return `
      <div class="tool-area">
        <div class="qrg-layout">
          <div class="qrg-controls">
            <div class="form-group">
              <label class="label">Text or URL</label>
              <input type="text" class="input" id="qrg-text" placeholder="https://example.com" value="">
            </div>
            <div class="form-group">
              <label class="label">Error Correction</label>
              <div class="qrg-ec-toggle" id="qrg-ec-toggle">
                ${EC_LEVELS.map((l) => `<button class="btn btn--ghost btn--sm ${l.value === 1 ? 'qrg-ec--active' : ''}" data-ec="${l.value}">${l.label}</button>`).join('')}
              </div>
            </div>
            <div class="form-group">
              <label class="label">Colors</label>
              <div class="qrg-color-row">
                <div class="qrg-color-field">
                  <span class="qrg-color-label">Foreground</span>
                  <input type="color" id="qrg-fg" value="#000000" class="qrg-color-input">
                </div>
                <div class="qrg-color-field">
                  <span class="qrg-color-label">Background</span>
                  <input type="color" id="qrg-bg" value="#ffffff" class="qrg-color-input">
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="label">Export Size</label>
              <div class="qrg-sizes" id="qrg-sizes">
                ${SIZES.map((s) => `<button class="btn btn--ghost btn--sm ${s.value === 512 ? 'qrg-size--active' : ''}" data-size="${s.value}">${s.label}</button>`).join('')}
              </div>
            </div>
            <div class="tool-actions">
              <button class="btn btn--primary" id="qrg-generate">Generate</button>
              <button class="btn btn--ghost" id="qrg-download-png">PNG</button>
              <button class="btn btn--ghost" id="qrg-download-svg">SVG</button>
              <button class="btn btn--ghost" id="qrg-copy">Copy</button>
            </div>
          </div>
          <div class="qrg-preview">
            <canvas id="qrg-canvas" width="512" height="512" class="qrg-canvas"></canvas>
            <div class="qrg-info" id="qrg-info"></div>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const canvas = root.querySelector('#qrg-canvas') as HTMLCanvasElement;
    const textInput = root.querySelector('#qrg-text') as HTMLInputElement;
    const infoEl = root.querySelector('#qrg-info')!;

    textInput.addEventListener('input', () => {
      this.text = textInput.value;
    });

    root.querySelectorAll('.qrg-ec--active, [data-ec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('#qrg-ec-toggle .btn')
          .forEach((b) => b.classList.remove('qrg-ec--active'));
        btn.classList.add('qrg-ec--active');
        this.ecLevel = parseInt((btn as HTMLElement).dataset.ec!);
      });
    });

    root.querySelector('#qrg-fg')!.addEventListener('input', (e) => {
      this.fgColor = (e.target as HTMLInputElement).value;
    });
    root.querySelector('#qrg-bg')!.addEventListener('input', (e) => {
      this.bgColor = (e.target as HTMLInputElement).value;
    });

    root.querySelectorAll('#qrg-sizes .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('#qrg-sizes .btn')
          .forEach((b) => b.classList.remove('qrg-size--active'));
        btn.classList.add('qrg-size--active');
        this.exportSize = parseInt((btn as HTMLElement).dataset.size!);
      });
    });

    root.querySelector('#qrg-generate')!.addEventListener('click', () => {
      this.generate(canvas, infoEl);
    });

    root
      .querySelector('#qrg-download-png')!
      .addEventListener('click', () => this.downloadPng(canvas));
    root.querySelector('#qrg-download-svg')!.addEventListener('click', () => this.downloadSvg());
    root.querySelector('#qrg-copy')!.addEventListener('click', () => this.copy(canvas));

    // Generate initial QR
    this.text = 'https://inztun.dev';
    textInput.value = this.text;
    this.generate(canvas, infoEl);
  }

  private generate(canvas: HTMLCanvasElement, infoEl: Element): void {
    if (!this.text) {
      Toast.info('Enter text or URL');
      return;
    }
    try {
      const qr = generateQR(this.text, this.ecLevel);
      renderToCanvas(qr, canvas, this.fgColor, this.bgColor);
      const version = (qr.size - 17) / 4;
      infoEl.textContent = `Version ${version} | ${qr.size}×${qr.size} modules | EC: ${EC_LEVELS[this.ecLevel].label}`;
      logToolAction('qr-generator', 'Generated QR code');
    } catch (e) {
      Toast.error((e as Error).message);
    }
  }

  private downloadPng(canvas: HTMLCanvasElement): void {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.exportSize;
    exportCanvas.height = this.exportSize;
    const ctx = exportCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, this.exportSize, this.exportSize);

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[Inztun] qr-${this.exportSize}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success(`${this.exportSize}px PNG downloaded`);
      logToolAction('qr-generator', `Downloaded QR PNG ${this.exportSize}px`);
    }, 'image/png');
  }

  private downloadSvg(): void {
    try {
      const qr = generateQR(this.text, this.ecLevel);
      const svg = qrToSVG(qr, this.fgColor, this.bgColor);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[Inztun] qr-${new Date().toISOString().slice(0, 10)}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('SVG downloaded');
      logToolAction('qr-generator', 'Downloaded QR SVG');
    } catch (e) {
      Toast.error((e as Error).message);
    }
  }

  private copy(canvas: HTMLCanvasElement): void {
    canvas.toBlob((blob) => {
      if (!blob) return;
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      Toast.copied('QR code image');
    }, 'image/png');
  }

  destroy(): void {}
}

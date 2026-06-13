import { Toast } from '../../../components/Toast';
import type { Tool } from '../../../types';

export class FlipText implements Tool {
  id = 'flip-text';
  name = 'Flip Text';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M17 1l4 4-4 4"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <path d="M7 23l-4-4 4-4"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>`;
  badge = '';

  private readonly flipMap: Record<string, string> = {
    'a': '\u0250', 'b': 'q', 'c': '\u0254', 'd': 'p', 'e': '\u01DD', 'f': '\u025F',
    'g': '\u0183', 'h': '\u0265', 'i': '\u0131', 'j': '\u027E', 'k': '\u029E',
    'l': '\u05DF', 'm': '\u026F', 'n': 'u', 'o': 'o', 'p': 'd', 'q': 'b',
    'r': '\u0279', 's': 's', 't': '\u0287', 'u': 'n', 'v': '\u028C', 'w': '\u028D',
    'x': 'x', 'y': '\u028E', 'z': 'z',
    'A': '\u2200', 'B': 'B', 'C': '\u0186', 'D': 'D', 'E': '\u018E', 'F': '\u2132',
    'G': '\u050C', 'H': 'H', 'I': 'I', 'J': '\u0528', 'K': 'K', 'L': '\u052D',
    'M': 'M', 'N': 'N', 'O': 'O', 'P': '\u0500', 'Q': 'Q', 'R': 'R',
    'S': 'S', 'T': '\u2534', 'U': '\u2229', 'V': '\u039B', 'W': 'W', 'X': 'X',
    'Y': '\u2144', 'Z': 'Z',
    '1': '\u0196', '2': '\u1105', '3': '\u0190', '4': '\u3123', '5': '\u078E',
    '6': '9', '7': '\u3125', '8': '8', '9': '6', '0': '0',
    '.': '\u02D9', ',': '\u02BD', "'": ',', '"': '\u201E', '`': ',',
    '!': '\u00A1', '?': '\u00BF', '(': ')', ')': '(', '[': ']', ']': '[',
    '{': '}', '}': '{', '<': '>', '>': '<', '&': '\u214B', '_': '\u203E',
  };

  private inputEl!: HTMLTextAreaElement;
  private outputEl!: HTMLTextAreaElement;
  private countEl!: HTMLElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="tool-split">
          <div class="tool-area__input">
            <div class="label-row">
              <label class="label">Input</label>
              <span class="char-count" id="ft-input-count">0 chars</span>
            </div>
            <textarea class="input input--textarea" id="ft-input" placeholder="Enter text..." spellcheck="false">Hello World</textarea>
          </div>
          <div class="tool-area__output">
            <label class="label">Flipped</label>
            <textarea class="input input--textarea" id="ft-output" readonly spellcheck="false"></textarea>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="ft-flip">Flip</button>
          <button class="btn btn--ghost" id="ft-copy">Copy</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#ft-input') as HTMLTextAreaElement;
    this.outputEl = root.querySelector('#ft-output') as HTMLTextAreaElement;
    this.countEl = root.querySelector('#ft-input-count') as HTMLElement;

    (root.querySelector('#ft-flip') as HTMLElement)?.addEventListener('click', () => this.flip());
    (root.querySelector('#ft-copy') as HTMLElement)?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.outputEl.value);
      Toast.copied();
    });

    this.inputEl?.addEventListener('input', () => {
      this.countEl.textContent = this.inputEl.value.length + ' chars';
    });

    this.flip();
  }

  flip(): void {
    const input = this.inputEl.value;
    let result = '';
    for (let i = input.length - 1; i >= 0; i--) {
      const char = input[i];
      result += this.flipMap[char] || char;
    }
    this.outputEl.value = result;
    Toast.success('Text flipped');
  }

  destroy(): void {}
}

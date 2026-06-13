import { Toast } from '../../../components/Toast';
import type { Tool } from '../../../types';

export class AsciiArt implements Tool {
  id = 'ascii-art';
  name = 'ASCII Art';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>`;
  badge = '';

  private readonly fonts: Record<string, Record<string, string[]>> = {
    standard: {
      'A': ['  █  ', ' █ █ ', '█████', '█   █', '█   █'],
      'B': ['████ ', '█   █', '████ ', '█   █', '████ '],
      'C': [' ████', '█    ', '█    ', '█    ', ' ████'],
      'D': ['████ ', '█   █', '█   █', '█   █', '████ '],
      'E': ['█████', '█    ', '████ ', '█    ', '█████'],
      'F': ['█████', '█    ', '████ ', '█    ', '█    '],
      'G': [' ████', '█    ', '█  ██', '█   █', ' ████'],
      'H': ['█   █', '█   █', '█████', '█   █', '█   █'],
      'I': ['█████', '  █  ', '  █  ', '  █  ', '█████'],
      'J': ['█████', '   █ ', '   █ ', '█  █ ', ' ██  '],
      'K': ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
      'L': ['█    ', '█    ', '█    ', '█    ', '█████'],
      'M': ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
      'N': ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
      'O': [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
      'P': ['████ ', '█   █', '████ ', '█    ', '█    '],
      'Q': [' ███ ', '█   █', '█ █ █', '█  █ ', ' ██ █'],
      'R': ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
      'S': [' ████', '█    ', ' ███ ', '    █', '████ '],
      'T': ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
      'U': ['█   █', '█   █', '█   █', '█   █', ' ███ '],
      'V': ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
      'W': ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
      'X': ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
      'Y': ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
      'Z': ['█████', '   █ ', '  █  ', ' █   ', '█████'],
      '0': [' ███ ', '█  ██', '█ █ █', '██  █', ' ███ '],
      '1': ['  █  ', ' ██  ', '  █  ', '  █  ', '█████'],
      '2': [' ███ ', '█   █', '  ██ ', ' █   ', '█████'],
      '3': ['████ ', '    █', ' ███ ', '    █', '████ '],
      '4': ['█  █ ', '█  █ ', '█████', '   █ ', '   █ '],
      '5': ['█████', '█    ', '████ ', '    █', '████ '],
      '6': [' ███ ', '█    ', '████ ', '█   █', ' ███ '],
      '7': ['█████', '   █ ', '  █  ', ' █   ', '█    '],
      '8': [' ███ ', '█   █', ' ███ ', '█   █', ' ███ '],
      '9': [' ███ ', '█   █', ' ████', '    █', ' ███ '],
      ' ': ['     ', '     ', '     ', '     ', '     '],
      '!': ['  █  ', '  █  ', '  █  ', '     ', '  █  '],
      '?': [' ███ ', '█   █', '  ██ ', '     ', '  █  '],
      '.': ['     ', '     ', '     ', '     ', '  █  '],
      ',': ['     ', '     ', '     ', '  █  ', ' █   '],
      ':': ['     ', '  █  ', '     ', '  █  ', '     '],
      '-': ['     ', '     ', '█████', '     ', '     '],
      '+': ['     ', '  █  ', ' ███ ', '  █  ', '     '],
      '=': ['     ', '█████', '     ', '█████', '     '],
    },
  };

  private inputEl!: HTMLInputElement;
  private outputEl!: HTMLElement;
  private countEl!: HTMLElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="form-group">
          <div class="label-row">
            <label class="label">Input Text</label>
            <span class="char-count" id="aa-input-count">0 chars</span>
          </div>
          <input class="input" id="aa-input" type="text" value="HELLO" placeholder="Enter text..." maxlength="20">
        </div>
        <div class="form-group" style="flex: 1;">
          <label class="label">ASCII Output</label>
          <pre class="ascii-output" id="aa-output"></pre>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="aa-generate">Generate</button>
          <button class="btn btn--ghost" id="aa-copy">Copy</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#aa-input') as HTMLInputElement;
    this.outputEl = root.querySelector('#aa-output') as HTMLElement;
    this.countEl = root.querySelector('#aa-input-count') as HTMLElement;

    (root.querySelector('#aa-generate') as HTMLElement)?.addEventListener('click', () => this.generate());
    (root.querySelector('#aa-copy') as HTMLElement)?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.outputEl.textContent ?? '');
      Toast.copied();
    });

    this.inputEl?.addEventListener('input', () => {
      this.countEl.textContent = this.inputEl.value.length + ' chars';
    });

    this.generate();
  }

  generate(): void {
    const text = this.inputEl.value.toUpperCase();
    const font = this.fonts.standard;
    const lines = ['', '', '', '', ''];

    for (const char of text) {
      const glyph = font[char] || font['?'];
      for (let i = 0; i < 5; i++) {
        lines[i] += (glyph[i] || '     ') + ' ';
      }
    }

    this.outputEl.textContent = lines.join('\n');
    Toast.success('Generated');
  }

  destroy(): void {}
}

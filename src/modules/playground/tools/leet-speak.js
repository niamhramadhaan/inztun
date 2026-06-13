import { Toast } from '../../../components/Toast.js';

export class LeetSpeak {
  constructor() {
    this.id = 'leet-speak';
    this.name = 'Leet Speak';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>`;
    this.badge = '1337';
    this.leetMap = {
      'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7',
      'b': '8', 'g': '9', 'l': '1', 'z': '2',
      'A': '4', 'E': '3', 'I': '1', 'O': '0', 'S': '5', 'T': '7',
      'B': '8', 'G': '9', 'L': '1', 'Z': '2',
    };
    this.leetMapAdvanced = {
      'a': '/-\\', 'b': '|3', 'c': '(', 'd': '|)', 'e': '3', 'f': '|=',
      'g': '9', 'h': '|-|', 'i': '!', 'j': '_|', 'k': '|<', 'l': '|_',
      'm': '|\\/|', 'n': '|\\|', 'o': '0', 'p': '|D', 'q': '(,)', 'r': '|Z',
      's': '5', 't': '7', 'u': '|_|', 'v': '\\/', 'w': '\\/\\/', 'x': '><',
      'y': '`/', 'z': '2',
    };
  }

  render() {
    return `
      <div class="tool-area">
        <div class="tool-split">
          <div class="tool-area__input">
            <div class="label-row">
              <label class="label">Input</label>
              <span class="char-count" id="ls-input-count">0 chars</span>
            </div>
            <textarea class="input input--textarea" id="ls-input" placeholder="Enter text..." spellcheck="false">Hello World</textarea>
          </div>
          <div class="tool-area__output">
            <label class="label">1337 Output</label>
            <textarea class="input input--textarea" id="ls-output" readonly spellcheck="false"></textarea>
          </div>
        </div>
        <div class="form-group">
          <label class="label">Style</label>
          <select class="input" id="ls-style">
            <option value="simple">Simple (4, 3, 1, 0, 5, 7)</option>
            <option value="advanced">Advanced (/\\-\\, |3, etc.)</option>
          </select>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="ls-convert">Convert</button>
          <button class="btn btn--ghost" id="ls-copy">Copy</button>
        </div>
      </div>
    `;
  }

  init(root) {
    this.inputEl = root.querySelector('#ls-input');
    this.outputEl = root.querySelector('#ls-output');
    this.styleEl = root.querySelector('#ls-style');
    this.countEl = root.querySelector('#ls-input-count');

    root.querySelector('#ls-convert')?.addEventListener('click', () => this.convert());
    root.querySelector('#ls-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.outputEl.value);
      Toast.copied();
    });

    this.inputEl?.addEventListener('input', () => {
      this.countEl.textContent = this.inputEl.value.length + ' chars';
    });

    this.convert();
  }

  convert() {
    const input = this.inputEl.value;
    const style = this.styleEl.value;
    const map = style === 'advanced' ? this.leetMapAdvanced : this.leetMap;

    let result = '';
    for (const char of input) {
      result += map[char] || char;
    }

    this.outputEl.value = result;
    Toast.success('Converted to 1337');
  }

  destroy() {}
}

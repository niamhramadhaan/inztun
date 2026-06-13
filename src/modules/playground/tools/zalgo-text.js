import { Toast } from '../../../components/Toast.js';

export class ZalgoText {
  constructor() {
    this.id = 'zalgo-text';
    this.name = 'Zalgo Text';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>`;
    this.badge = '';
    this.zalgoUp = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030A','\u030B','\u030C','\u030D','\u030E','\u030F','\u0310','\u0311','\u0312','\u0313','\u0314','\u0315','\u031A','\u033D','\u0340','\u0341','\u0342','\u0343','\u0344','\u0346'];
    this.zalgoDown = ['\u0316','\u0317','\u0318','\u0319','\u031C','\u031D','\u031E','\u031F','\u0320','\u0321','\u0322','\u0323','\u0324','\u0325','\u0326','\u0327','\u0328','\u0329','\u032A','\u032B','\u032C','\u032D','\u032E','\u032F','\u0330','\u0331','\u0332','\u0333','\u0339','\u033A','\u033B','\u033C','\u0345','\u0347','\u0348','\u0349','\u034A','\u034B','\u034C'];
    this.zalgoMid = ['\u0334','\u0335','\u0336','\u0337','\u0338'];
  }

  render() {
    return `
      <div class="tool-area">
        <div class="form-group">
          <div class="label-row">
            <label class="label">Input</label>
            <span class="char-count" id="zt-input-count">0 chars</span>
          </div>
          <textarea class="input input--textarea" id="zt-input" placeholder="Enter text..." rows="2" spellcheck="false">Hello World</textarea>
        </div>
        <div class="form-group">
          <label class="label">Intensity: <span id="zt-level-val">3</span></label>
          <input type="range" id="zt-level" min="1" max="10" value="3" class="password-slider">
        </div>
        <div class="form-group">
          <div class="label-row">
            <label class="label">Output</label>
            <span class="char-count" id="zt-output-count">0 chars</span>
          </div>
          <textarea class="input input--textarea" id="zt-output" rows="4" readonly spellcheck="false"></textarea>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="zt-generate">Generate</button>
          <button class="btn btn--ghost" id="zt-copy">Copy</button>
        </div>
      </div>
    `;
  }

  init(root) {
    this.inputEl = root.querySelector('#zt-input');
    this.outputEl = root.querySelector('#zt-output');
    this.levelEl = root.querySelector('#zt-level');
    this.levelValEl = root.querySelector('#zt-level-val');
    this.inputCountEl = root.querySelector('#zt-input-count');
    this.outputCountEl = root.querySelector('#zt-output-count');

    this.levelEl?.addEventListener('input', () => {
      this.levelValEl.textContent = this.levelEl.value;
    });

    root.querySelector('#zt-generate')?.addEventListener('click', () => this.generate());
    root.querySelector('#zt-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.outputEl.value);
      Toast.copied();
    });

    this.inputEl?.addEventListener('input', () => {
      this.inputCountEl.textContent = this.inputEl.value.length + ' chars';
    });

    this.generate();
  }

  generate() {
    const text = this.inputEl.value;
    const level = parseInt(this.levelEl.value);
    let result = '';

    for (const char of text) {
      result += char;
      const upCount = Math.floor(Math.random() * level) + 1;
      const downCount = Math.floor(Math.random() * level) + 1;
      const midCount = Math.floor(Math.random() * Math.min(level, 3));

      for (let i = 0; i < upCount; i++) {
        result += this.zalgoUp[Math.floor(Math.random() * this.zalgoUp.length)];
      }
      for (let i = 0; i < downCount; i++) {
        result += this.zalgoDown[Math.floor(Math.random() * this.zalgoDown.length)];
      }
      for (let i = 0; i < midCount; i++) {
        result += this.zalgoMid[Math.floor(Math.random() * this.zalgoMid.length)];
      }
    }

    this.outputEl.value = result;
    this.outputCountEl.textContent = result.length + ' chars';
    Toast.success('Zalgo generated');
  }

  destroy() {}
}

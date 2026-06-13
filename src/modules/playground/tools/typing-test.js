import { Toast } from '../../../components/Toast.js';

export class TypingTest {
  constructor() {
    this.id = 'typing-test';
    this.name = 'Typing Test';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
    </svg>`;
    this.badge = 'Fun';
    this.texts = [
      'The quick brown fox jumps over the lazy dog.',
      'Pack my box with five dozen liquor jugs.',
      'How vexingly quick daft zebras jump.',
      'Sphinx of black quartz, judge my vow.',
      'Two driven jocks help fax my big quiz.',
      'The five boxing wizards jump quickly.',
      'Jackdaws love my big sphinx of quartz.',
      'Crazy Frederick bought many very exquisite opal jewels.',
    ];
    this.state = { started: false, startTime: 0, text: '', input: '', errors: 0 };
  }

  render() {
    return `
      <div class="tool-area">
        <div class="typing-stats" id="tt-stats">
          <div class="typing-stat"><span class="typing-stat__value" id="tt-wpm">0</span><span class="typing-stat__label">WPM</span></div>
          <div class="typing-stat"><span class="typing-stat__value" id="tt-accuracy">100%</span><span class="typing-stat__label">Accuracy</span></div>
          <div class="typing-stat"><span class="typing-stat__value" id="tt-time">0s</span><span class="typing-stat__label">Time</span></div>
          <div class="typing-stat"><span class="typing-stat__value" id="tt-errors">0</span><span class="typing-stat__label">Errors</span></div>
        </div>
        <div class="typing-display" id="tt-display"></div>
        <textarea class="typing-input" id="tt-input" placeholder="Start typing to begin..." spellcheck="false" autocomplete="off"></textarea>
        <div class="tool-actions">
          <button class="btn btn--primary" id="tt-restart">Restart</button>
          <button class="btn btn--ghost" id="tt-new">New Text</button>
        </div>
      </div>
    `;
  }

  init(root) {
    this.displayEl = root.querySelector('#tt-display');
    this.inputEl = root.querySelector('#tt-input');
    this.wpmEl = root.querySelector('#tt-wpm');
    this.accuracyEl = root.querySelector('#tt-accuracy');
    this.timeEl = root.querySelector('#tt-time');
    this.errorsEl = root.querySelector('#tt-errors');

    this.inputEl?.addEventListener('input', () => this.onInput());
    root.querySelector('#tt-restart')?.addEventListener('click', () => this.restart());
    root.querySelector('#tt-new')?.addEventListener('click', () => this.newText());

    this.newText();
  }

  newText() {
    this.state.text = this.texts[Math.floor(Math.random() * this.texts.length)];
    this.restart();
  }

  restart() {
    this.state = { started: false, startTime: 0, text: this.state.text, input: '', errors: 0 };
    this.inputEl.value = '';
    this.renderDisplay();
    this.updateStats();
    this.inputEl.focus();
  }

  onInput() {
    if (!this.state.started) {
      this.state.started = true;
      this.state.startTime = Date.now();
      this.timer = setInterval(() => this.updateStats(), 100);
    }

    this.state.input = this.inputEl.value;
    this.state.errors = 0;
    for (let i = 0; i < this.state.input.length; i++) {
      if (this.state.input[i] !== this.state.text[i]) this.state.errors++;
    }

    this.renderDisplay();
    this.updateStats();

    if (this.state.input.length >= this.state.text.length) {
      clearInterval(this.timer);
      this.inputEl.disabled = true;
      Toast.success('Test complete!');
    }
  }

  renderDisplay() {
    const { text, input } = this.state;
    let html = '';
    for (let i = 0; i < text.length; i++) {
      let cls = '';
      if (i < input.length) {
        cls = input[i] === text[i] ? 'typing-char--correct' : 'typing-char--wrong';
      } else if (i === input.length) {
        cls = 'typing-char--current';
      }
      html += `<span class="typing-char ${cls}">${text[i] === ' ' ? '&nbsp;' : text[i]}</span>`;
    }
    this.displayEl.innerHTML = html;
  }

  updateStats() {
    const { started, startTime, input, text, errors } = this.state;
    const elapsed = started ? (Date.now() - startTime) / 1000 : 0;
    const words = input.length / 5;
    const wpm = elapsed > 0 ? Math.round((words / elapsed) * 60) : 0;
    const accuracy = input.length > 0 ? Math.round(((input.length - errors) / input.length) * 100) : 100;

    this.wpmEl.textContent = wpm;
    this.accuracyEl.textContent = accuracy + '%';
    this.timeEl.textContent = Math.floor(elapsed) + 's';
    this.errorsEl.textContent = errors;
  }

  destroy() {
    clearInterval(this.timer);
  }
}

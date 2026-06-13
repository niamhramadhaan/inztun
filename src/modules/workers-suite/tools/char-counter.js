import { Toast } from '../../../components/Toast.js';

export class CharacterCounter {
  constructor() {
    this.id = 'char-counter';
    this.name = 'Character Counter';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 7V4h16v3"/>
      <path d="M9 20h6"/>
      <path d="M12 4v16"/>
    </svg>`;
    this.badge = '';
  }

  render() {
    return `
      <div class="tool-area">
        <div class="form-group" style="flex: 1;">
          <label class="label">Input Text</label>
          <textarea class="input input--textarea" id="cc-input" placeholder="Start typing or paste text..." style="flex: 1;" spellcheck="false"></textarea>
        </div>
        <div class="stats-grid" id="cc-stats"></div>
      </div>
    `;
  }

  init(root) {
    this.inputEl = root.querySelector('#cc-input');
    this.statsEl = root.querySelector('#cc-stats');

    this.inputEl?.addEventListener('input', () => this.updateStats());
    this.updateStats();
  }

  updateStats() {
    const text = this.inputEl.value;
    const stats = this.calculateStats(text);

    this.statsEl.innerHTML = `
      <div class="stat-item">
        <span class="stat-value">${stats.characters}</span>
        <span class="stat-label">Characters</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.charactersNoSpaces}</span>
        <span class="stat-label">Chars (no spaces)</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.words}</span>
        <span class="stat-label">Words</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.sentences}</span>
        <span class="stat-label">Sentences</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.paragraphs}</span>
        <span class="stat-label">Paragraphs</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.lines}</span>
        <span class="stat-label">Lines</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.readingTime}</span>
        <span class="stat-label">Reading time</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.speakingTime}</span>
        <span class="stat-label">Speaking time</span>
      </div>
    `;
  }

  calculateStats(text) {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
    const paragraphs = text.trim() ? text.split(/\n\n+/).filter(p => p.trim()).length : 0;
    const lines = text.trim() ? text.split('\n').length : 0;
    const readingTime = this.formatTime(Math.ceil(words / 200));
    const speakingTime = this.formatTime(Math.ceil(words / 150));

    return { characters, charactersNoSpaces, words, sentences, paragraphs, lines, readingTime, speakingTime };
  }

  formatTime(minutes) {
    if (minutes < 1) return '< 1 min';
    if (minutes === 1) return '1 min';
    return `${minutes} min`;
  }

  destroy() {}
}

import { Toast } from '../../../components/Toast.js';

export class RegexTester {
  constructor() {
    this.id = 'regex-tester';
    this.name = 'Regex Tester';
    this.icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <path d="M8 11h6"/>
    </svg>`;
    this.badge = 'Live';
  }

  render() {
    return `
      <div class="tool-area">
        <div class="form-group">
          <label class="label">Pattern</label>
          <div style="display: flex; gap: var(--space-2);">
            <input class="input" id="rx-pattern" type="text" placeholder="\\b\\w+\\b" style="flex: 1;">
            <input class="input" id="rx-flags" type="text" value="gm" placeholder="gm" style="width: 60px;">
            <select class="input" id="rx-presets" style="width: 140px;">
              <option value="">Common patterns</option>
              <option value="\\b\\w+\\b">Words</option>
              <option value="\\d+">Numbers</option>
              <option value="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}">Email</option>
              <option value="https?://[^\\s]+">URLs</option>
              <option value="#[0-9a-fA-F]{6}">Hex colors</option>
              <option value="\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b">IP addresses</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="flex: 1;">
          <label class="label">Test String</label>
          <textarea class="input input--textarea" id="rx-test" placeholder="Enter text to test..." style="flex: 1;">The quick brown fox jumps over the lazy dog.
Pack my box with five dozen liquor jugs.
Contact: user@example.com or visit https://example.com</textarea>
        </div>
        <div class="form-group">
          <label class="label">Matches</label>
          <div class="regex-matches" id="rx-matches">
            <span style="color: var(--text-muted);">Enter a pattern to see matches</span>
          </div>
        </div>
        <div class="tool-actions">
          <span class="badge" id="rx-count">0 matches</span>
        </div>
      </div>
    `;
  }

  init(root) {
    this.patternEl = root.querySelector('#rx-pattern');
    this.flagsEl = root.querySelector('#rx-flags');
    this.testEl = root.querySelector('#rx-test');
    this.matchesEl = root.querySelector('#rx-matches');
    this.countEl = root.querySelector('#rx-count');
    this.presetsEl = root.querySelector('#rx-presets');

    const handler = () => this.test();
    this.patternEl?.addEventListener('input', handler);
    this.flagsEl?.addEventListener('input', handler);
    this.testEl?.addEventListener('input', handler);

    this.presetsEl?.addEventListener('change', () => {
      if (this.presetsEl.value) {
        this.patternEl.value = this.presetsEl.value;
        this.test();
        Toast.info('Pattern applied');
      }
    });
  }

  test() {
    const pattern = this.patternEl.value;
    const flags = this.flagsEl.value;
    const testStr = this.testEl.value;

    if (!pattern) {
      this.matchesEl.innerHTML = '<span style="color: var(--text-muted);">Enter a pattern to see matches</span>';
      this.countEl.textContent = '0 matches';
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const matches = [];
      let match;

      if (flags.includes('g')) {
        while ((match = regex.exec(testStr)) !== null) {
          matches.push({ text: match[0], index: match.index });
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      } else {
        match = regex.exec(testStr);
        if (match) matches.push({ text: match[0], index: match.index });
      }

      if (matches.length === 0) {
        this.matchesEl.innerHTML = '<span style="color: var(--text-muted);">No matches found</span>';
      } else {
        let highlighted = testStr;
        let offset = 0;
        for (const m of matches) {
          const before = highlighted.slice(0, m.index + offset);
          const matchText = highlighted.slice(m.index + offset, m.index + offset + m.text.length);
          const after = highlighted.slice(m.index + offset + m.text.length);
          highlighted = `${before}<span class="regex-match">${this.escapeHtml(matchText)}</span>${after}`;
          offset += 39;
        }
        this.matchesEl.innerHTML = highlighted.replace(/\n/g, '<br>');
      }

      this.countEl.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;
      this.matchesEl.style.borderLeft = matches.length > 0 ? '2px solid var(--accent)' : '2px solid var(--border-hairline)';
    } catch (e) {
      this.matchesEl.innerHTML = `<span style="color: var(--color-error);">Invalid regex: ${e.message}</span>`;
      this.countEl.textContent = 'Error';
    }
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  destroy() {}
}

import { Toast } from '../../../components/Toast';
import { copyToClipboard } from '../../../utils/image';

export class MarkdownPreview {
  id = 'markdown-preview';
  name = 'Markdown Preview';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>`;
  badge = 'GFM';
  private inputEl!: HTMLTextAreaElement;
  private outputEl!: HTMLDivElement;
  private countEl!: HTMLSpanElement;

  render(): string {
    const defaultContent = [
      '# Hello World',
      '',
      'This is **bold** and *italic* text.',
      '',
      '## Features',
      '- Lists work',
      '- **Bold** and *italic*',
      '- Inline code',
      '- [Links](https://example.com)',
      '',
      '> Blockquotes work too',
      '',
      '| Column 1 | Column 2 |',
      '|----------|----------|',
      '| Cell 1   | Cell 2   |',
    ].join('\n');

    return `
      <div class="tool-area">
        <div class="md-split">
          <div class="md-editor">
            <div class="label-row">
              <label class="label">Markdown</label>
              <span class="char-count" id="md-input-count">0 chars</span>
            </div>
            <textarea class="input md-textarea" id="md-input" spellcheck="false">${defaultContent}</textarea>
          </div>
          <div class="md-preview">
            <label class="label">Preview</label>
            <div class="md-output" id="md-output"></div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="md-copy-html">Copy HTML</button>
          <button class="btn btn--ghost" id="md-copy-md">Copy Markdown</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.inputEl = root.querySelector('#md-input') as HTMLTextAreaElement;
    this.outputEl = root.querySelector('#md-output') as HTMLDivElement;
    this.countEl = root.querySelector('#md-input-count') as HTMLSpanElement;

    this.inputEl?.addEventListener('input', () => {
      this.renderPreview();
      this.updateCount();
    });

    root.querySelector('#md-copy-html')?.addEventListener('click', () => {
      void copyToClipboard(this.outputEl.innerHTML);
      Toast.copied('HTML');
    });

    root.querySelector('#md-copy-md')?.addEventListener('click', () => {
      void copyToClipboard(this.inputEl.value);
      Toast.copied('Markdown');
    });

    this.renderPreview();
    this.updateCount();
  }

  updateCount(): void {
    if (this.countEl && this.inputEl) {
      this.countEl.textContent = this.inputEl.value.length + ' chars';
    }
  }

  renderPreview(): void {
    this.outputEl.innerHTML = this.parseMarkdown(this.inputEl.value);
  }

  parseMarkdown(md: string): string {
    let html = md;

    // Code blocks (triple backtick)
    html = html.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_match: string, lang: string, code: string): string =>
        '<pre class="md-code-block"><code class="language-' +
        lang +
        '">' +
        escapeHtml(code.trim()) +
        '</code></pre>',
    );

    // Inline code (single backtick)
    html = html.replace(
      /`([^`]+)`/g,
      (_m, code: string) => '<code class="md-inline-code">' + escapeHtml(code) + '</code>',
    );

    // Headers
    html = html.replace(/^### (.+)$/gm, (_m, t: string) => '<h3>' + escapeHtml(t) + '</h3>');
    html = html.replace(/^## (.+)$/gm, (_m, t: string) => '<h2>' + escapeHtml(t) + '</h2>');
    html = html.replace(/^# (.+)$/gm, (_m, t: string) => '<h1>' + escapeHtml(t) + '</h1>');

    // Bold and italic
    html = html.replace(
      /\*\*(.+?)\*\*/g,
      (_m, t: string) => '<strong>' + escapeHtml(t) + '</strong>',
    );
    html = html.replace(/\*(.+?)\*/g, (_m, t: string) => '<em>' + escapeHtml(t) + '</em>');
    html = html.replace(/~~(.+?)~~/g, (_m, t: string) => '<del>' + escapeHtml(t) + '</del>');

    // Links and images
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (_m, alt: string, src: string) =>
        '<img src="' + escapeAttr(src) + '" alt="' + escapeAttr(alt) + '" class="md-img">',
    );
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, text: string, href: string) =>
        '<a href="' +
        escapeAttr(href) +
        '" target="_blank" rel="noopener">' +
        escapeHtml(text) +
        '</a>',
    );

    // Blockquotes
    html = html.replace(
      /^> (.+)$/gm,
      (_m, t: string) => '<blockquote>' + escapeHtml(t) + '</blockquote>',
    );

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Unordered lists
    html = html.replace(/^[-*] (.+)$/gm, (_m, t: string) => '<li>' + escapeHtml(t) + '</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, (_m, t: string) => '<li>' + escapeHtml(t) + '</li>');

    // Tables
    html = html.replace(/^\|(.+)\|$/gm, (_match: string, content: string): string => {
      const cells = content.split('|').map((c: string): string => c.trim());
      if (cells.every((c: string): boolean => /^[-:]+$/.test(c))) return '<!-- table separator -->';
      return (
        '<tr>' +
        cells.map((c: string): string => '<td>' + escapeHtml(c) + '</td>').join('') +
        '</tr>'
      );
    });
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, (match: string): string => {
      const clean = match.replace(/<!-- table separator -->\n?/g, '');
      return '<table class="md-table">' + clean + '</table>';
    });

    // Paragraphs
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, (_m, t: string) => '<p>' + escapeHtml(t) + '</p>');

    // Clean up extra newlines
    html = html.replace(/\n{2,}/g, '\n');

    return html;
  }

  destroy(): void {}
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

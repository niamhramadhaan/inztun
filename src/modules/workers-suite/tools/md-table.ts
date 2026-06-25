import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import type { Tool } from '../../../types';
import { copyToClipboard } from '../../../utils/image';

function parseMarkdownTable(md: string): { headers: string[]; rows: string[][] } | null {
  const lines = md
    .trim()
    .split('\n')
    .filter((l) => l.trim());
  if (lines.length < 2) return null;

  const splitRow = (line: string): string[] =>
    line
      .split('|')
      .map((c) => c.trim())
      .filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));

  const headers = splitRow(lines[0]);
  if (headers.length === 0) return null;

  // Skip separator row (contains ---)
  let dataStart = 1;
  if (lines[1] && /^[\s|:-]+$/.test(lines[1])) dataStart = 2;

  const rows: string[][] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    while (cells.length < headers.length) cells.push('');
    rows.push(cells.slice(0, headers.length));
  }

  return { headers, rows };
}

function toMarkdown(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => {
    const maxData = rows.reduce((max, r) => Math.max(max, (r[i] || '').length), 0);
    return Math.max(h.length, maxData, 3);
  });

  const pad = (s: string, w: number) => s.padEnd(w, ' ');
  const sep = colWidths.map((w) => '-'.repeat(w)).join(' | ');

  let md = '| ' + headers.map((h, i) => pad(h, colWidths[i])).join(' | ') + ' |\n';
  md += '| ' + sep + ' |\n';
  for (const row of rows) {
    md += '| ' + row.map((c, i) => pad(c || '', colWidths[i])).join(' | ') + ' |\n';
  }
  return md;
}

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (s: string) =>
    s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  let csv = headers.map(escape).join(',') + '\n';
  for (const row of rows) csv += row.map(escape).join(',') + '\n';
  return csv;
}

function toJSON(headers: string[], rows: string[][]): string {
  const data = rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
  return JSON.stringify(data, null, 2);
}

export class MdTable implements Tool {
  id = 'md-table';
  name = 'Markdown Table';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`;

  private headers: string[] = [];
  private rows: string[][] = [];

  render(): string {
    return `
      <div class="tool-area">
        <div class="mdt-layout">
          <div class="mdt-input-area">
            <div class="label-row">
              <label class="label">Markdown Table</label>
              <span class="char-count" id="mdt-count">0 rows</span>
            </div>
            <textarea class="input input--textarea" id="mdt-input" placeholder="| Name | Age | City |\n|------|-----|------|\n| Alice | 30 | NYC |\n| Bob | 25 | LA |" spellcheck="false" style="min-height:140px;"></textarea>
            <div class="tool-actions">
              <button class="btn btn--primary" id="mdt-parse">Parse →</button>
              <button class="btn btn--ghost" id="mdt-clear">Clear</button>
            </div>
          </div>

          <div class="mdt-preview-area">
            <label class="label">Preview (parsed)</label>
            <div class="mdt-table-wrap" id="mdt-table-wrap">
              <div class="mdt-empty">Paste a markdown table and click Parse</div>
            </div>
          </div>

          <div class="mdt-output-area">
            <div class="label-row">
              <label class="label">Output</label>
              <div class="mdt-mode-toggle" id="mdt-mode-toggle">
                <button class="btn btn--ghost btn--sm mdt-mode--active" data-mode="markdown">Markdown</button>
                <button class="btn btn--ghost btn--sm" data-mode="csv">CSV</button>
                <button class="btn btn--ghost btn--sm" data-mode="json">JSON</button>
              </div>
            </div>
            <pre class="input input--textarea" id="mdt-output" style="min-height:100px;cursor:text;"></pre>
            <div class="tool-actions">
              <button class="btn btn--ghost" id="mdt-copy">Copy</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    const inputEl = root.querySelector('#mdt-input') as HTMLTextAreaElement;
    const countEl = root.querySelector('#mdt-count')!;
    const tableWrap = root.querySelector('#mdt-table-wrap')!;
    const outputEl = root.querySelector('#mdt-output')!;
    let currentMode = 'markdown';

    const updateCount = () => {
      const lines = inputEl.value
        .trim()
        .split('\n')
        .filter((l) => l.trim());
      countEl.textContent = `${lines.length} lines`;
    };

    const renderTable = () => {
      if (this.headers.length === 0) {
        tableWrap.innerHTML = '<div class="mdt-empty">No data parsed</div>';
        return;
      }
      let html = '<div class="mdt-table-scroll"><table class="mdt-table"><thead><tr>';
      html += this.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
      html += '</tr></thead><tbody>';
      for (const row of this.rows) {
        html += '<tr>' + row.map((c) => `<td>${escapeHtml(c)}</td>`).join('') + '</tr>';
      }
      html += '</tbody></table></div>';
      html += `<div class="mdt-table-info">${this.rows.length} rows × ${this.headers.length} columns</div>`;
      tableWrap.innerHTML = html;
    };

    const updateOutput = () => {
      if (this.headers.length === 0) {
        outputEl.textContent = '';
        return;
      }
      switch (currentMode) {
        case 'markdown':
          outputEl.textContent = toMarkdown(this.headers, this.rows);
          break;
        case 'csv':
          outputEl.textContent = toCSV(this.headers, this.rows);
          break;
        case 'json':
          outputEl.textContent = toJSON(this.headers, this.rows);
          break;
      }
    };

    root.querySelector('#mdt-parse')!.addEventListener('click', () => {
      const result = parseMarkdownTable(inputEl.value);
      if (!result) {
        Toast.error('Could not parse table');
        return;
      }
      this.headers = result.headers;
      this.rows = result.rows;
      renderTable();
      updateOutput();
      Toast.success(`Parsed ${this.rows.length} rows`);
      logToolAction('md-table', `Parsed ${this.rows.length} rows`);
    });

    root.querySelector('#mdt-clear')!.addEventListener('click', () => {
      inputEl.value = '';
      this.headers = [];
      this.rows = [];
      renderTable();
      updateOutput();
      updateCount();
    });

    root.querySelectorAll('#mdt-mode-toggle .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('#mdt-mode-toggle .btn')
          .forEach((b) => b.classList.remove('mdt-mode--active'));
        btn.classList.add('mdt-mode--active');
        currentMode = (btn as HTMLElement).dataset.mode!;
        updateOutput();
      });
    });

    root.querySelector('#mdt-copy')!.addEventListener('click', () => {
      void copyToClipboard(outputEl.textContent || '');
      Toast.copied(currentMode.toUpperCase());
      logToolAction('md-table', `Copied as ${currentMode}`);
    });

    inputEl.addEventListener('input', updateCount);
    updateCount();
  }

  destroy(): void {}
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

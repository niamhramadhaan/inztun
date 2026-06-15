import { Toast } from '../../../components/Toast';
import { db } from '../../../core/db';
import { wireSharedInputs } from '../../../core/shared-inputs';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
];

export class InvoiceGenerator {
  id = 'invoice-generator';
  name = 'Invoice Generator';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>`;
  badge = 'Popular';

  private items: LineItem[] = [{ description: '', quantity: 1, rate: 0 }];
  private currency: Currency = CURRENCIES[0];
  private logoDataUrl: string | null = null;

  private itemsEl!: HTMLDivElement;
  private subtotalEl!: HTMLSpanElement;
  private taxEl!: HTMLSpanElement;
  private totalEl!: HTMLSpanElement;
  private taxInput!: HTMLInputElement;
  private previewEl!: HTMLDivElement;
  private historyEl!: HTMLDivElement;
  private currencySymbolEls: HTMLElement[] = [];

  render(): string {
    return `
      <div class="tool-area">
        <div class="fci-layout">
          <div class="fci-form">
            <div class="fci-section-title">From</div>
            <div class="fci-row">
              <div class="form-group"><label class="label" data-shared>Name</label><input type="text" class="input" id="fci-from-name" placeholder="Your name"></div>
              <div class="form-group"><label class="label" data-shared>Company</label><input type="text" class="input" id="fci-from-company" placeholder="Your company"></div>
            </div>
            <div class="fci-row">
              <div class="form-group"><label class="label" data-shared>Email</label><input type="email" class="input" id="fci-from-email" placeholder="you@company.com"></div>
              <div class="form-group"><label class="label">Logo</label><input type="file" class="input" id="fci-logo" accept="image/*" style="padding:6px"></div>
            </div>

            <div class="fci-section-title">To</div>
            <div class="fci-row">
              <div class="form-group"><label class="label" data-shared>Client Name</label><input type="text" class="input" id="fci-client" placeholder="Acme Corp"></div>
              <div class="form-group"><label class="label">Client Email</label><input type="email" class="input" id="fci-client-email" placeholder="client@acme.com"></div>
            </div>

            <div class="fci-section-title">Details</div>
            <div class="fci-row">
              <div class="form-group"><label class="label">Invoice #</label><input type="text" class="input" id="fci-number" value="INV-001" style="width:120px"></div>
              <div class="form-group"><label class="label" data-shared>Date</label><input type="date" class="input" id="fci-date" style="width:150px"></div>
              <div class="form-group"><label class="label">Due Date</label><input type="date" class="input" id="fci-due-date" style="width:150px"></div>
              <div class="form-group"><label class="label">Currency</label>
                <select class="input" id="fci-currency" style="width:140px">
                  ${CURRENCIES.map(c => `<option value="${c.code}" ${c.code === 'USD' ? 'selected' : ''}>${c.symbol} ${c.code}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="fci-section-title">Line Items</div>
            <div class="fcinv-items" id="fci-items"></div>
            <button class="btn btn--sm" id="fci-add">+ Add Line Item</button>

            <div class="fcinv-totals">
              <div class="form-group"><label class="label" data-shared>Tax Rate %</label><input type="number" class="input" id="fci-tax" value="0" min="0" max="100" style="width:80px"></div>
              <div class="fcinv-totals__values">
                <div><span class="label">Subtotal</span><span id="fci-subtotal">$0.00</span></div>
                <div><span class="label">Tax</span><span id="fci-tax-amt">$0.00</span></div>
                <div class="fcinv-total"><span class="label">Total</span><span id="fci-total">$0.00</span></div>
              </div>
            </div>

            <div class="form-group"><label class="label">Notes</label><textarea class="input input--textarea" id="fci-notes" rows="2" placeholder="Payment terms, thank you note..."></textarea></div>

            <div class="tool-actions">
              <button class="btn btn--ghost" id="fci-copy">Copy Text</button>
              <button class="btn btn--ghost" id="fci-save-inv">Save to History</button>
              <button class="btn btn--primary" id="fci-print">Print / Export</button>
            </div>
          </div>

          <div class="fci-preview-col">
            <div class="fci-paper" id="fci-paper"></div>
            <div class="fci-history">
              <button class="fci-history-toggle" id="fci-history-toggle">
                <span>Invoice History</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="fci-history-list" id="fci-history-list" style="display:none;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.itemsEl = root.querySelector('#fci-items')!;
    this.subtotalEl = root.querySelector('#fci-subtotal')!;
    this.taxEl = root.querySelector('#fci-tax-amt')!;
    this.totalEl = root.querySelector('#fci-total')!;
    this.taxInput = root.querySelector('#fci-tax')!;
    this.previewEl = root.querySelector('#fci-paper')!;
    this.historyEl = root.querySelector('#fci-history-list')!;

    (root.querySelector('#fci-date') as HTMLInputElement).valueAsDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    (root.querySelector('#fci-due-date') as HTMLInputElement).valueAsDate = dueDate;

    const currencySelect = root.querySelector('#fci-currency') as HTMLSelectElement;
    currencySelect.addEventListener('change', () => {
      this.currency = CURRENCIES.find(c => c.code === currencySelect.value) || CURRENCIES[0];
      this.update();
    });

    const logoInput = root.querySelector('#fci-logo') as HTMLInputElement;
    logoInput.addEventListener('change', () => {
      const file = logoInput.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          this.logoDataUrl = reader.result as string;
          this.update();
        };
        reader.readAsDataURL(file);
      }
    });

    root.querySelector('#fci-add')!.addEventListener('click', () => {
      this.items.push({ description: '', quantity: 1, rate: 0 });
      this.renderItems();
    });

    this.taxInput.addEventListener('input', () => this.update());

    root.querySelector('#fci-copy')!.addEventListener('click', () => {
      const text = this.buildPlainText();
      navigator.clipboard.writeText(text);
      Toast.copied('Invoice');
    });

    root.querySelector('#fci-save-inv')!.addEventListener('click', () => this.saveToHistory());

    root.querySelector('#fci-print')!.addEventListener('click', () => window.print());

    root.querySelector('#fci-history-toggle')!.addEventListener('click', () => {
      const list = this.historyEl;
      const isOpen = list.style.display !== 'none';
      list.style.display = isOpen ? 'none' : '';
    });

    [root.querySelector('#fci-from-name'), root.querySelector('#fci-from-company'),
     root.querySelector('#fci-from-email'), root.querySelector('#fci-client'),
     root.querySelector('#fci-client-email'), root.querySelector('#fci-number'),
     root.querySelector('#fci-date'), root.querySelector('#fci-due-date'),
     root.querySelector('#fci-notes')].forEach(el => {
      el?.addEventListener('input', () => this.update());
    });

    wireSharedInputs(root);
    this.renderItems();
    this.loadHistory();
  }

  private renderItems(): void {
    const sym = this.currency.symbol;
    this.itemsEl.innerHTML = this.items.map((item, i) => `
      <div class="fcinv-item">
        <input type="text" class="input" placeholder="Description" value="${item.description}" data-i="${i}" data-field="description">
        <input type="number" class="input" placeholder="Qty" value="${item.quantity}" min="1" style="width:70px" data-i="${i}" data-field="quantity">
        <input type="number" class="input" placeholder="Rate" value="${item.rate || ''}" min="0" step="0.01" style="width:100px" data-i="${i}" data-field="rate">
        <span class="fcinv-item__amount">${sym}${(item.quantity * item.rate).toFixed(2)}</span>
        ${this.items.length > 1 ? `<button class="btn btn--ghost btn--sm fcinv-remove" data-i="${i}">×</button>` : ''}
      </div>
    `).join('');

    this.itemsEl.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', (e) => {
        const i = parseInt((e.target as HTMLElement).dataset.i!);
        const field = (e.target as HTMLElement).dataset.field!;
        const val = (e.target as HTMLInputElement).value;
        if (field === 'description') this.items[i].description = val;
        else if (field === 'quantity') this.items[i].quantity = parseInt(val) || 0;
        else if (field === 'rate') this.items[i].rate = parseFloat(val) || 0;
        this.update();
      });
    });

    this.itemsEl.querySelectorAll('.fcinv-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt((e.target as HTMLElement).dataset.i!);
        this.items.splice(i, 1);
        this.renderItems();
        this.update();
      });
    });

    this.update();
  }

  private update(): void {
    const subtotal = this.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxRate = parseFloat(this.taxInput.value) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    const sym = this.currency.symbol;

    this.subtotalEl.textContent = `${sym}${subtotal.toFixed(2)}`;
    this.taxEl.textContent = `${sym}${tax.toFixed(2)}`;
    this.totalEl.textContent = `${sym}${total.toFixed(2)}`;

    this.renderPaper(subtotal, tax, taxRate, total);
  }

  private getFormValues(): Record<string, string> {
    const get = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
    return {
      fromName: get('fci-from-name'),
      fromCompany: get('fci-from-company'),
      fromEmail: get('fci-from-email'),
      client: get('fci-client'),
      clientEmail: get('fci-client-email'),
      number: get('fci-number'),
      date: get('fci-date'),
      dueDate: get('fci-due-date'),
      notes: (document.getElementById('fci-notes') as HTMLTextAreaElement)?.value || '',
    };
  }

  private renderPaper(subtotal: number, tax: number, taxRate: number, total: number): void {
    const f = this.getFormValues();
    const sym = this.currency.symbol;
    const logoHtml = this.logoDataUrl
      ? `<img src="${this.logoDataUrl}" class="fci-paper__logo" alt="Logo">`
      : '';

    const itemRows = this.items.map(item => {
      const amt = (item.quantity * item.rate).toFixed(2);
      return `<tr>
        <td>${item.description || '—'}</td>
        <td class="fci-num">${item.quantity}</td>
        <td class="fci-num">${sym}${item.rate.toFixed(2)}</td>
        <td class="fci-num">${sym}${amt}</td>
      </tr>`;
    }).join('');

    this.previewEl.innerHTML = `
      <div class="fci-paper__inner">
        <div class="fci-paper__header">
          <div class="fci-paper__header-left">
            ${logoHtml}
            <div class="fci-paper__from">
              <strong>${f.fromName || 'Your Name'}</strong>
              ${f.fromCompany ? `<br>${f.fromCompany}` : ''}
              ${f.fromEmail ? `<br>${f.fromEmail}` : ''}
            </div>
          </div>
          <div class="fci-paper__header-right">
            <div class="fci-paper__title">INVOICE</div>
            <div class="fci-paper__number">${f.number || 'INV-001'}</div>
            <div class="fci-paper__dates">
              <span>Date: ${f.date || '—'}</span>
              <span>Due: ${f.dueDate || '—'}</span>
            </div>
          </div>
        </div>

        <div class="fci-paper__to">
          <div class="fci-paper__to-label">Bill To</div>
          <strong>${f.client || 'Client Name'}</strong>
          ${f.clientEmail ? `<br>${f.clientEmail}` : ''}
        </div>

        <table class="fci-paper__table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="fci-num">Qty</th>
              <th class="fci-num">Rate</th>
              <th class="fci-num">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="fci-paper__totals">
          <div class="fci-paper__totals-row">
            <span>Subtotal</span>
            <span>${sym}${subtotal.toFixed(2)}</span>
          </div>
          ${taxRate > 0 ? `<div class="fci-paper__totals-row">
            <span>Tax (${taxRate}%)</span>
            <span>${sym}${tax.toFixed(2)}</span>
          </div>` : ''}
          <div class="fci-paper__totals-row fci-paper__totals-row--total">
            <span>Total</span>
            <span>${sym}${total.toFixed(2)}</span>
          </div>
        </div>

        ${f.notes ? `<div class="fci-paper__notes">${f.notes}</div>` : ''}
      </div>
    `;
  }

  private buildPlainText(): string {
    const f = this.getFormValues();
    const subtotal = this.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxRate = parseFloat(this.taxInput.value) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    const sym = this.currency.symbol;

    let text = `INVOICE ${f.number}\nDate: ${f.date}\nDue: ${f.dueDate}\n\n`;
    text += `From: ${f.fromName}${f.fromCompany ? ' (' + f.fromCompany + ')' : ''}\n`;
    text += `To: ${f.client}\n\n`;
    text += `DESCRIPTION          QTY    RATE    AMOUNT\n`;
    text += `${'─'.repeat(50)}\n`;
    this.items.forEach(item => {
      const amt = (item.quantity * item.rate).toFixed(2);
      text += `${(item.description || '').padEnd(20)} ${String(item.quantity).padStart(5)}  ${sym}${item.rate.toFixed(2).padStart(7)}  ${sym}${amt.padStart(8)}\n`;
    });
    text += `${'─'.repeat(50)}\n`;
    text += `Subtotal: ${sym}${subtotal.toFixed(2)}\n`;
    if (taxRate > 0) text += `Tax (${taxRate}%): ${sym}${tax.toFixed(2)}\n`;
    text += `TOTAL: ${sym}${total.toFixed(2)}\n`;
    if (f.notes) text += `\nNotes: ${f.notes}\n`;
    return text;
  }

  private async saveToHistory(): Promise<void> {
    const data = {
      form: this.getFormValues(),
      items: this.items,
      currency: this.currency.code,
      taxRate: parseFloat(this.taxInput.value) || 0,
      logoDataUrl: this.logoDataUrl,
    };
    await db.addHistory('invoice', data);
    Toast.success('Invoice saved to history');
    this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    const entries = await db.getHistory('invoice', 20);
    if (entries.length === 0) {
      this.historyEl.innerHTML = '<p style="color:var(--text-ghost);font-size:var(--text-xs);padding:var(--space-2);">No saved invoices yet.</p>';
      return;
    }

    this.historyEl.innerHTML = entries.map((entry, i) => {
      const d = entry.data as Record<string, unknown>;
      const form = d.form as Record<string, string> || {};
      const date = new Date(entry.timestamp).toLocaleDateString();
      return `
        <div class="fci-history-item" data-index="${i}">
          <span class="fci-history-item__name">${form.client || 'Unknown'}</span>
          <span class="fci-history-item__date">${date}</span>
          <span class="fci-history-item__num">${form.number || ''}</span>
        </div>
      `;
    }).join('');

    this.historyEl.querySelectorAll('.fci-history-item').forEach((el, i) => {
      el.addEventListener('click', () => this.loadFromHistory(entries[i].data as Record<string, unknown>));
    });
  }

  private loadFromHistory(data: Record<string, unknown>): void {
    const form = data.form as Record<string, string> || {};
    const items = data.items as LineItem[] || [{ description: '', quantity: 1, rate: 0 }];
    const currCode = data.currency as string || 'USD';
    const taxRate = data.taxRate as number || 0;
    const logo = data.logoDataUrl as string | null;

    const set = (id: string, val: string) => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
      if (el) el.value = val;
    };

    set('fci-from-name', form.fromName || '');
    set('fci-from-company', form.fromCompany || '');
    set('fci-from-email', form.fromEmail || '');
    set('fci-client', form.client || '');
    set('fci-client-email', form.clientEmail || '');
    set('fci-number', form.number || 'INV-001');
    set('fci-date', form.date || '');
    set('fci-due-date', form.dueDate || '');
    set('fci-notes', form.notes || '');
    (document.getElementById('fci-tax') as HTMLInputElement).value = String(taxRate);

    const currencySelect = document.getElementById('fci-currency') as HTMLSelectElement;
    if (currencySelect) currencySelect.value = currCode;
    this.currency = CURRENCIES.find(c => c.code === currCode) || CURRENCIES[0];

    this.items = items;
    this.logoDataUrl = logo;
    this.renderItems();
    Toast.info('Invoice loaded from history');
  }

  destroy(): void {}
}

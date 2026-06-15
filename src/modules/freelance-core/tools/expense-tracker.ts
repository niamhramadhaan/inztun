import { Toast } from '../../../components/Toast';
import { wireSharedInputs } from '../../../core/shared-inputs';

interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  date: string;
}

const CATEGORIES = ['Software', 'Hardware', 'Travel', 'Meals', 'Office', 'Marketing', 'Other'];

export class ExpenseTracker {
  id = 'expense-tracker';
  name = 'Expense Tracker';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>`;
  badge = '';
  private expenses: Expense[] = [];
  private listEl!: HTMLDivElement;
  private totalEl!: HTMLSpanElement;
  private breakdownEl!: HTMLDivElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="fce-form">
          <div class="form-group"><label class="label">Category</label>
            <select class="input" id="fce-category">${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
          </div>
          <div class="form-group"><label class="label">Amount ($)</label><input type="number" class="input" id="fce-amount" placeholder="0.00" min="0" step="0.01" style="width:120px"></div>
          <div class="form-group"><label class="label">Description</label><input type="text" class="input" id="fce-desc" placeholder="What was this for?"></div>
          <div class="form-group"><label class="label" data-shared>Date</label><input type="date" class="input" id="fce-date" style="width:150px"></div>
          <button class="btn btn--primary" id="fce-add">Add</button>
        </div>
        <div class="fce-summary">
          <span class="fce-total" id="fce-total">Total: $0.00</span>
          <div class="fce-breakdown" id="fce-breakdown"></div>
        </div>
        <div class="fce-list" id="fce-list"></div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.listEl = root.querySelector('#fce-list')!;
    this.totalEl = root.querySelector('#fce-total')!;
    this.breakdownEl = root.querySelector('#fce-breakdown')!;

    (root.querySelector('#fce-date') as HTMLInputElement).valueAsDate = new Date();

    wireSharedInputs(root);

    const stored = localStorage.getItem('fce-expenses');
    if (stored) this.expenses = JSON.parse(stored);

    root.querySelector('#fce-add')!.addEventListener('click', () => {
      const category = (root.querySelector('#fce-category') as HTMLSelectElement).value;
      const amount = parseFloat((root.querySelector('#fce-amount') as HTMLInputElement).value) || 0;
      const description = (root.querySelector('#fce-desc') as HTMLInputElement).value;
      const date = (root.querySelector('#fce-date') as HTMLInputElement).value;

      if (amount <= 0) return;

      this.expenses.unshift({ id: Date.now(), category, amount, description, date });
      this.save();
      this.renderList();
      (root.querySelector('#fce-amount') as HTMLInputElement).value = '';
      (root.querySelector('#fce-desc') as HTMLInputElement).value = '';
      Toast.success('Expense added');
    });

    this.renderList();
  }

  private renderList(): void {
    const total = this.expenses.reduce((sum, e) => sum + e.amount, 0);
    this.totalEl.textContent = `Total: $${total.toFixed(2)}`;

    const byCategory = new Map<string, number>();
    this.expenses.forEach(e => {
      byCategory.set(e.category, (byCategory.get(e.category) || 0) + e.amount);
    });

    this.breakdownEl.innerHTML = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `<span class="fce-badge">${cat}: $${amt.toFixed(2)}</span>`)
      .join('');

    this.listEl.innerHTML = this.expenses.length === 0
      ? '<p style="color:var(--text-muted);font-size:var(--text-sm);">No expenses yet.</p>'
      : this.expenses.map(e => `
        <div class="fce-item">
          <span class="fce-item__cat">${e.category}</span>
          <span class="fce-item__desc">${e.description}</span>
          <span class="fce-item__amount">$${e.amount.toFixed(2)}</span>
          <span class="fce-item__date">${e.date}</span>
          <button class="btn btn--ghost btn--sm fce-delete" data-id="${e.id}">×</button>
        </div>
      `).join('');

    this.listEl.querySelectorAll('.fce-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt((e.target as HTMLElement).dataset.id!);
        this.expenses = this.expenses.filter(exp => exp.id !== id);
        this.save();
        this.renderList();
      });
    });
  }

  private save(): void {
    localStorage.setItem('fce-expenses', JSON.stringify(this.expenses));
  }

  destroy(): void {}
}

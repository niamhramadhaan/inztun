import { Toast } from '../../../components/Toast';
import { db, type Expense, type Project } from '../../../core/db';
import { router } from '../../../core/router';
import { wireSharedInputs } from '../../../core/shared-inputs';
import { getCurrencySymbol } from '../../../components/SettingsPanel';

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
  private projects: Project[] = [];
  private currencySymbol = '$';
  private root!: HTMLElement;
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
          <div class="form-group"><label class="label">Amount (${this.currencySymbol})</label><input type="number" class="input" id="fce-amount" placeholder="0.00" min="0" step="0.01" style="width:120px"></div>
          <div class="form-group"><label class="label">Description</label><input type="text" class="input" id="fce-desc" placeholder="What was this for?"></div>
          <div class="form-group"><label class="label">Linked Project</label>
            <select class="input" id="fce-project-select">
              <option value="">— None —</option>
            </select>
          </div>
          <div class="form-group"><label class="label" data-shared>Date</label><input type="date" class="input" id="fce-date" style="width:150px"></div>
          <button class="btn btn--primary" id="fce-add">Add</button>
        </div>
        <div class="fce-summary">
          <span class="fce-total" id="fce-total">Total: ${this.currencySymbol}0.00</span>
          <div class="fce-breakdown" id="fce-breakdown"></div>
        </div>
        <div class="fce-list" id="fce-list"></div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.root = root;
    this.listEl = root.querySelector('#fce-list')!;
    this.totalEl = root.querySelector('#fce-total')!;
    this.breakdownEl = root.querySelector('#fce-breakdown')!;

    (root.querySelector('#fce-date') as HTMLInputElement).valueAsDate = new Date();

    wireSharedInputs(root);

    const [expenses, projects, defaultCurrency] = await Promise.all([
      db.getAllExpenses(),
      db.getAllProjects(),
      db.getPreference('defaultCurrency', 'USD') as Promise<string>,
    ]);
    this.expenses = expenses;
    this.projects = projects;
    this.currencySymbol = getCurrencySymbol(defaultCurrency || 'USD');
    this.populateProjectSelect();

    root.querySelector('#fce-add')!.addEventListener('click', () => this.addExpense());

    this.renderList();
  }

  private populateProjectSelect(): void {
    const select = this.root.querySelector('#fce-project-select') as HTMLSelectElement;
    const active = this.projects.filter(p => p.status === 'active');
    select.innerHTML = '<option value="">— None —</option>' +
      active.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  private getSelectedProjectId(): number | undefined {
    const select = this.root.querySelector('#fce-project-select') as HTMLSelectElement;
    const val = select.value;
    return val ? parseInt(val) : undefined;
  }

  private addExpense(): void {
    const category = (this.root.querySelector('#fce-category') as HTMLSelectElement).value;
    const amount = parseFloat((this.root.querySelector('#fce-amount') as HTMLInputElement).value) || 0;
    const description = (this.root.querySelector('#fce-desc') as HTMLInputElement).value;
    const date = (this.root.querySelector('#fce-date') as HTMLInputElement).value;

    if (amount <= 0) return;

    const entry: Expense = {
      id: Date.now(),
      category,
      amount,
      description,
      projectId: this.getSelectedProjectId(),
      date,
    };
    this.expenses.unshift(entry);
    db.putExpense(entry);
    this.renderList();
    (this.root.querySelector('#fce-amount') as HTMLInputElement).value = '';
    (this.root.querySelector('#fce-desc') as HTMLInputElement).value = '';
    Toast.success('Expense added');
  }

  private renderList(): void {
    const s = this.currencySymbol;
    const total = this.expenses.reduce((sum, e) => sum + e.amount, 0);
    this.totalEl.textContent = `Total: ${s}${total.toFixed(2)}`;

    const byCategory = new Map<string, number>();
    this.expenses.forEach(e => {
      byCategory.set(e.category, (byCategory.get(e.category) || 0) + e.amount);
    });

    this.breakdownEl.innerHTML = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `<span class="fce-badge">${cat}: ${s}${amt.toFixed(2)}</span>`)
      .join('');

    this.listEl.innerHTML = this.expenses.length === 0
      ? '<p style="color:var(--text-muted);font-size:var(--text-sm);">No expenses yet.</p>'
      : this.expenses.map(e => `
        <div class="fce-item">
          <span class="fce-item__cat">${e.category}</span>
          <span class="fce-item__desc">${e.description}</span>
          ${e.projectId ? '<span class="fce-item__linked" title="Linked project">◆</span>' : ''}
          <span class="fce-item__amount">${s}${e.amount.toFixed(2)}</span>
          <span class="fce-item__date">${e.date}</span>
          <button class="btn btn--ghost btn--sm fce-invoice" data-id="${e.id}" title="Add to Invoice">↗</button>
          <button class="btn btn--ghost btn--sm fce-delete" data-id="${e.id}">×</button>
        </div>
      `).join('');

    this.listEl.querySelectorAll('.fce-delete').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const id = parseInt((ev.target as HTMLElement).dataset.id!);
        this.expenses = this.expenses.filter(exp => exp.id !== id);
        db.deleteExpense(id);
        this.renderList();
      });
    });

    this.listEl.querySelectorAll('.fce-invoice').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const id = parseInt((ev.target as HTMLElement).dataset.id!);
        const entry = this.expenses.find(exp => exp.id === id);
        if (!entry) return;
        const items = [{
          description: `${entry.category}: ${entry.description}`,
          quantity: 1,
          rate: entry.amount,
          projectId: entry.projectId,
        }];
        db.setPreference('fc-pending-invoice-items', items);
        router.navigate('freelance-core', 'invoice-generator');
      });
    });
  }

  destroy(): void {}
}

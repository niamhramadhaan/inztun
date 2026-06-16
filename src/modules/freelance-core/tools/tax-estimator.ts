import { db } from '../../../core/db';
import { getCurrencySymbol } from '../../../components/SettingsPanel';

const BRACKETS_2024 = [
  { rate: 0.10, min: 0, max: 11600 },
  { rate: 0.12, min: 11600, max: 47150 },
  { rate: 0.22, min: 47150, max: 100525 },
  { rate: 0.24, min: 100525, max: 191950 },
  { rate: 0.32, min: 191950, max: 243725 },
  { rate: 0.35, min: 243725, max: 609350 },
  { rate: 0.37, min: 609350, max: Infinity },
];

const BRACKETS_MARRIED = [
  { rate: 0.10, min: 0, max: 23200 },
  { rate: 0.12, min: 23200, max: 94300 },
  { rate: 0.22, min: 94300, max: 201050 },
  { rate: 0.24, min: 201050, max: 383900 },
  { rate: 0.32, min: 383900, max: 487450 },
  { rate: 0.35, min: 487450, max: 731200 },
  { rate: 0.37, min: 731200, max: Infinity },
];

export class TaxEstimator {
  id = 'tax-estimator';
  name = 'Income Tax Estimator';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>`;

  private currencySymbol = '$';
  private incomeInput!: HTMLInputElement;
  private statusSelect!: HTMLSelectElement;
  private resultEl!: HTMLDivElement;
  private barEl!: HTMLDivElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="tax-controls">
          <div class="form-group" style="flex:1;">
            <label class="label">Annual Income (${this.currencySymbol})</label>
            <input type="number" class="input" id="tax-income" placeholder="75000" min="0" step="1000" style="font-family:var(--font-mono);">
          </div>
          <div class="form-group">
            <label class="label">Filing Status</label>
            <select class="input" id="tax-status" style="width:auto;">
              <option value="single">Single</option>
              <option value="married">Married Filing Jointly</option>
            </select>
          </div>
        </div>
        <div class="tax-bar" id="tax-bar"></div>
        <div class="tax-result" id="tax-result"></div>
        <div class="tax-breakdown" id="tax-breakdown"></div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.incomeInput = root.querySelector('#tax-income')!;
    this.statusSelect = root.querySelector('#tax-status')!;
    this.resultEl = root.querySelector('#tax-result')!;
    this.barEl = root.querySelector('#tax-bar')!;
    const breakdownEl = root.querySelector('#tax-breakdown')!;

    const defaultCurrency = await db.getPreference('defaultCurrency', 'USD') as string;
    this.currencySymbol = getCurrencySymbol(defaultCurrency || 'USD');

    const update = () => {
      const income = parseFloat(this.incomeInput.value) || 0;
      const brackets = this.statusSelect.value === 'married' ? BRACKETS_MARRIED : BRACKETS_2024;
      const result = this.calculate(income, brackets);
      const s = this.currencySymbol;

      this.resultEl.innerHTML = `
        <div class="tax-stat">
          <span class="tax-stat__label">Total Tax</span>
          <span class="tax-stat__value" style="color:var(--color-error);">${s}${result.totalTax.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
        <div class="tax-stat">
          <span class="tax-stat__label">Effective Rate</span>
          <span class="tax-stat__value">${(result.effectiveRate * 100).toFixed(1)}%</span>
        </div>
        <div class="tax-stat">
          <span class="tax-stat__label">Take-Home</span>
          <span class="tax-stat__value" style="color:var(--color-success);">${s}${result.takeHome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
        <div class="tax-stat">
          <span class="tax-stat__label">Monthly</span>
          <span class="tax-stat__value">${s}${(result.takeHome / 12).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
      `;

      this.barEl.innerHTML = result.bracketBreakdown
        .filter(b => b.amount > 0)
        .map(b => {
          const pct = (b.amount / income) * 100;
          return `<div class="tax-bar__segment" style="width:${pct}%;background:${this.bracketColor(b.rate)};" title="${(b.rate * 100).toFixed(0)}%: ${s}${b.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}"></div>`;
        }).join('');

      breakdownEl.innerHTML = result.bracketBreakdown
        .filter(b => b.amount > 0)
        .map(b => `
          <div class="tax-row">
            <span class="tax-row__rate">${(b.rate * 100).toFixed(0)}%</span>
            <span class="tax-row__range">${s}${b.min.toLocaleString()} – ${b.max === Infinity ? '∞' : s + b.max.toLocaleString()}</span>
            <span class="tax-row__amount">${s}${b.tax.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
        `).join('');
    };

    this.incomeInput.addEventListener('input', update);
    this.statusSelect.addEventListener('change', update);
    update();
  }

  private calculate(income: number, brackets: typeof BRACKETS_2024) {
    let totalTax = 0;
    const bracketBreakdown = brackets.map(b => {
      const taxable = Math.max(0, Math.min(income, b.max) - b.min);
      const tax = taxable * b.rate;
      totalTax += tax;
      return { rate: b.rate, min: b.min, max: b.max, amount: taxable, tax };
    });
    return {
      totalTax,
      effectiveRate: income > 0 ? totalTax / income : 0,
      takeHome: income - totalTax,
      bracketBreakdown,
    };
  }

  private bracketColor(rate: number): string {
    const colors: Record<number, string> = {
      0.10: '#4ade80', 0.12: '#a3e635', 0.22: '#facc15',
      0.24: '#fb923c', 0.32: '#f87171', 0.35: '#e879f9', 0.37: '#c084fc',
    };
    return colors[rate] || '#94a3b8';
  }

  destroy(): void {}
}

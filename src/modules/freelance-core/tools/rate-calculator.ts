import { Toast } from '../../../components/Toast';
import { wireSharedInputs } from '../../../core/shared-inputs';

export class RateCalculator {
  id = 'rate-calculator';
  name = 'Rate Calculator';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>`;
  badge = '';
  private incomeInput!: HTMLInputElement;
  private weeksInput!: HTMLInputElement;
  private hoursInput!: HTMLInputElement;
  private overheadInput!: HTMLInputElement;
  private taxInput!: HTMLInputElement;
  private resultEl!: HTMLDivElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="fcr-grid">
          <div class="form-group"><label class="label">Desired Annual Income ($)</label><input type="number" class="input" id="fcr-income" value="100000" min="0"></div>
          <div class="form-group"><label class="label">Working Weeks/Year</label><input type="number" class="input" id="fcr-weeks" value="48" min="1" max="52"></div>
          <div class="form-group"><label class="label">Hours/Week</label><input type="number" class="input" id="fcr-hours" value="40" min="1" max="80"></div>
          <div class="form-group"><label class="label">Overhead %</label><input type="number" class="input" id="fcr-overhead" value="25" min="0" max="100"></div>
          <div class="form-group"><label class="label" data-shared>Tax Rate %</label><input type="number" class="input" id="fcr-tax" value="30" min="0" max="100"></div>
        </div>
        <div class="fcr-result" id="fcr-result"></div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.incomeInput = root.querySelector('#fcr-income')!;
    this.weeksInput = root.querySelector('#fcr-weeks')!;
    this.hoursInput = root.querySelector('#fcr-hours')!;
    this.overheadInput = root.querySelector('#fcr-overhead')!;
    this.taxInput = root.querySelector('#fcr-tax')!;
    this.resultEl = root.querySelector('#fcr-result')!;

    wireSharedInputs(root);

    const update = () => this.update();
    [this.incomeInput, this.weeksInput, this.hoursInput, this.overheadInput, this.taxInput].forEach(el => {
      el.addEventListener('input', update);
    });

    this.update();
  }

  private update(): void {
    const income = parseFloat(this.incomeInput.value) || 0;
    const weeks = parseInt(this.weeksInput.value) || 48;
    const hours = parseInt(this.hoursInput.value) || 40;
    const overheadPct = parseFloat(this.overheadInput.value) || 0;
    const taxPct = parseFloat(this.taxInput.value) || 0;

    const totalHours = weeks * hours;
    const grossNeeded = income / (1 - taxPct / 100);
    const withOverhead = grossNeeded * (1 + overheadPct / 100);
    const hourly = totalHours > 0 ? withOverhead / totalHours : 0;
    const daily = hourly * 8;
    const weekly = hourly * hours;

    this.resultEl.innerHTML = `
      <div class="fcr-cards">
        <div class="fcr-card">
          <span class="fcr-card__label">Hourly Rate</span>
          <span class="fcr-card__value">$${hourly.toFixed(2)}</span>
        </div>
        <div class="fcr-card">
          <span class="fcr-card__label">Daily Rate</span>
          <span class="fcr-card__value">$${daily.toFixed(2)}</span>
        </div>
        <div class="fcr-card">
          <span class="fcr-card__label">Weekly Rate</span>
          <span class="fcr-card__value">$${weekly.toFixed(2)}</span>
        </div>
        <div class="fcr-card">
          <span class="fcr-card__label">Billable Hours</span>
          <span class="fcr-card__value">${totalHours.toLocaleString()}</span>
        </div>
      </div>
    `;
  }

  destroy(): void {}
}

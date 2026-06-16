import { Toast } from '../../../components/Toast';
import { db } from '../../../core/db';
import { wireSharedInputs } from '../../../core/shared-inputs';
import { getCurrencySymbol } from '../../../components/SettingsPanel';

const TEMPLATES: Record<string, { name: string; text: string }> = {
  contractor: {
    name: 'Independent Contractor Agreement',
    text: `INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is entered into as of {{date}} between {{client_name}} ("Client") and the Contractor.

SCOPE OF WORK
The Contractor agrees to provide the following services: {{scope}}

COMPENSATION
The Client agrees to pay the Contractor at a rate of {{rate}} per {{period}}.

PAYMENT TERMS
Payment is due within {{payment_days}} days of invoice date.

TERM
This agreement begins on {{date}} and continues until completed.

INTELLECTUAL PROPERTY
All work product created under this agreement shall be owned by the Client upon full payment.

CONFIDENTIALITY
The Contractor agrees to maintain confidentiality of all proprietary information.

INDEPENDENT CONTRACTOR STATUS
The Contractor is an independent contractor, not an employee. The Contractor is responsible for their own taxes and insurance.`,
  },
  sow: {
    name: 'Statement of Work (SOW)',
    text: `STATEMENT OF WORK

Project: {{project}}
Client: {{client_name}}
Date: {{date}}

1. PROJECT OVERVIEW
{{scope}}

2. DELIVERABLES
- [ ] Deliverable 1
- [ ] Deliverable 2
- [ ] Deliverable 3

3. TIMELINE
Start Date: {{date}}
Estimated Completion: {{end_date}}

4. COMPENSATION
Total Project Fee: {{currency}}{{total_fee}}
Payment Schedule:
- 50% upon signing
- 50% upon completion

5. CHANGE REQUESTS
Any changes to scope require written approval and may affect timeline and compensation.`,
  },
  nda: {
    name: 'Non-Disclosure Agreement (NDA)',
    text: `NON-DISCLOSURE AGREEMENT

This NDA is entered into on {{date}} between {{client_name}} and the Contractor.

CONFIDENTIAL INFORMATION
Both parties agree to protect confidential information shared during the engagement.

OBLIGATIONS
The receiving party shall:
- Not disclose confidential information to third parties
- Use the information only for the purpose of this engagement
- Take reasonable measures to protect the information

EXCLUSIONS
This obligation does not apply to information that:
- Is publicly available
- Was known before disclosure
- Is independently developed

TERM
This agreement remains in effect for {{term}} years from the date of disclosure.`,
  },
  payment: {
    name: 'Invoice Payment Terms',
    text: `PAYMENT TERMS

Invoice Number: {{invoice_number}}
Date: {{date}}
Due Date: {{due_date}}

PAYMENT TERMS
Payment is due within {{payment_days}} days of the invoice date.

LATE PAYMENT
A late fee of {{late_fee}}% per month will be charged on overdue balances.

PAYMENT METHODS
- Bank Transfer: [Account Details]
- PayPal: [PayPal Email]
- Check: Mailing Address

QUESTIONS
Contact: {{email}}

Thank you for your business!`,
  },
};

export class ContractTemplates {
  id = 'contract-templates';
  name = 'Contract Templates';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M9 15l2 2 4-4"/>
    </svg>`;
  badge = '';
  private templateSelect!: HTMLSelectElement;
  private previewEl!: HTMLPreElement;
  private varsContainer!: HTMLDivElement;
  private currentVars: Record<string, string> = {};
  private currencySymbol = '$';

  render(): string {
    return `
      <div class="tool-area">
        <div class="form-group">
          <label class="label">Template</label>
          <select class="input" id="fcct-template">
            ${Object.entries(TEMPLATES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}
          </select>
        </div>
        <div class="fcct-vars" id="fcct-vars"></div>
        <pre class="input input--textarea" id="fcct-preview" style="min-height:300px;cursor:text;white-space:pre-wrap;"></pre>
        <div class="tool-actions">
          <button class="btn btn--primary" id="fcct-copy">Copy to Clipboard</button>
        </div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.templateSelect = root.querySelector('#fcct-template')!;
    this.previewEl = root.querySelector('#fcct-preview')!;
    this.varsContainer = root.querySelector('#fcct-vars')!;

    const defaultCurrency = await db.getPreference('defaultCurrency', 'USD') as string;
    this.currencySymbol = getCurrencySymbol(defaultCurrency || 'USD');
    this.currentVars['currency'] = this.currencySymbol;

    this.templateSelect.addEventListener('change', () => {
      this.currentVars = { currency: this.currencySymbol };
      this.renderVars();
      this.update();
    });

    root.querySelector('#fcct-copy')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.previewEl.textContent || '');
      Toast.copied('Contract');
    });

    this.renderVars();
    wireSharedInputs(root);
    this.update();
  }

  private renderVars(): void {
    const template = TEMPLATES[this.templateSelect.value];
    const matches = template.text.match(/\{\{(\w+)\}\}/g) || [];
    const vars = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))].filter(v => v !== 'currency');
    this.varsContainer.innerHTML = vars.map(v => `
      <div class="form-group"><label class="label" data-shared>${v.replace(/_/g, ' ')}</label><input type="text" class="input" data-var="${v}" placeholder="${v}"></div>
    `).join('');

    this.varsContainer.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', (e) => {
        const varName = (e.target as HTMLElement).dataset.var!;
        this.currentVars[varName] = (e.target as HTMLInputElement).value;
        this.update();
      });
    });

  }

  private update(): void {
    const template = TEMPLATES[this.templateSelect.value];
    let text = template.text;
    Object.entries(this.currentVars).forEach(([key, val]) => {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || `{{${key}}}`);
    });
    this.previewEl.textContent = text;
  }

  destroy(): void {}
}

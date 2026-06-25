import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getCurrencySymbol } from '../../../components/SettingsPanel';
import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { db } from '../../../core/db';
import { wireSharedInputs } from '../../../core/shared-inputs';
import { logDownload } from '../../../utils/download-tracker';
import { copyToClipboard, downloadBlob, escapeHtml, stampPdfMetadata } from '../../../utils/image';

type VarType = 'text' | 'textarea' | 'date' | 'currency' | 'toggle';

interface TemplateVar {
  name: string;
  label: string;
  type: VarType;
  default?: string;
  placeholder?: string;
}

interface Section {
  heading: string;
  body: string;
}

interface TemplateDef {
  name: string;
  category: 'agreements' | 'project' | 'protection' | 'payment';
  vars: TemplateVar[];
  sections: Section[];
}

const TEMPLATES: Record<string, TemplateDef> = {
  proposal: {
    name: 'Project Proposal',
    category: 'project',
    vars: [
      { name: 'company_name', label: 'Your Company', type: 'text', placeholder: 'Acme Studio' },
      { name: 'client_name', label: 'Client Name', type: 'text', placeholder: 'Client Corp' },
      {
        name: 'project_title',
        label: 'Project Title',
        type: 'text',
        placeholder: 'Website Redesign',
      },
      { name: 'date', label: 'Date', type: 'date' },
      {
        name: 'executive_summary',
        label: 'Executive Summary',
        type: 'textarea',
        placeholder: 'Brief overview of the project and your approach...',
      },
      {
        name: 'objectives',
        label: 'Objectives',
        type: 'textarea',
        placeholder:
          '- Increase conversion by 20%\n- Improve mobile experience\n- Modernize brand presence',
      },
      {
        name: 'scope',
        label: 'Scope of Work',
        type: 'textarea',
        placeholder: 'Detailed description of what is included...',
      },
      {
        name: 'deliverables',
        label: 'Deliverables',
        type: 'textarea',
        placeholder: '- Responsive website (5 pages)\n- Design system\n- CMS integration',
      },
      {
        name: 'timeline',
        label: 'Timeline',
        type: 'textarea',
        placeholder: 'Week 1-2: Discovery\nWeek 3-4: Design\nWeek 5-8: Development',
      },
      { name: 'budget', label: 'Total Budget', type: 'currency', placeholder: '15000' },
      {
        name: 'payment_schedule',
        label: 'Payment Schedule',
        type: 'textarea',
        default: '50% upon signing\n50% upon completion',
        placeholder: '',
      },
      {
        name: 'assumptions',
        label: 'Assumptions & Exclusions',
        type: 'textarea',
        placeholder:
          '- Client provides all content\n- Up to 2 rounds of revisions\n- Hosting not included',
      },
      {
        name: 'validity_days',
        label: 'Proposal Validity (days)',
        type: 'text',
        default: '30',
        placeholder: '30',
      },
      { name: 'email', label: 'Contact Email', type: 'text', placeholder: 'hello@acme.studio' },
    ],
    sections: [
      { heading: 'Executive Summary', body: '{{executive_summary}}' },
      { heading: 'Objectives', body: '{{objectives}}' },
      { heading: 'Scope of Work', body: '{{scope}}' },
      { heading: 'Deliverables', body: '{{deliverables}}' },
      { heading: 'Timeline', body: '{{timeline}}' },
      {
        heading: 'Investment',
        body: 'Total project fee: {{currency}}{{budget}}\n\nPayment Schedule:\n{{payment_schedule}}',
      },
      { heading: 'Assumptions & Exclusions', body: '{{assumptions}}' },
      {
        heading: 'Terms',
        body: 'This proposal is valid for {{validity_days}} days from the date above. Upon acceptance, a formal agreement will be executed.\n\nFor questions, contact: {{email}}',
      },
    ],
  },

  contractor: {
    name: 'Independent Contractor Agreement',
    category: 'agreements',
    vars: [
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      {
        name: 'contractor_name',
        label: 'Contractor',
        type: 'text',
        placeholder: 'Your Name / Company',
      },
      { name: 'date', label: 'Effective Date', type: 'date' },
      {
        name: 'scope',
        label: 'Scope of Services',
        type: 'textarea',
        placeholder: 'Description of services to be provided...',
      },
      { name: 'rate', label: 'Rate', type: 'currency', placeholder: '150' },
      {
        name: 'period',
        label: 'Rate Period',
        type: 'text',
        default: 'hour',
        placeholder: 'hour / day / project',
      },
      {
        name: 'payment_days',
        label: 'Payment Terms (days)',
        type: 'text',
        default: '30',
        placeholder: '30',
      },
      { name: 'term_end', label: 'Agreement End Date', type: 'date' },
    ],
    sections: [
      {
        heading: 'Parties',
        body: 'This Independent Contractor Agreement ("Agreement") is entered into as of {{date}} between {{client_name}} ("Client") and {{contractor_name}} ("Contractor").',
      },
      {
        heading: 'Scope of Services',
        body: 'The Contractor agrees to provide the following services:\n\n{{scope}}',
      },
      {
        heading: 'Compensation',
        body: 'The Client agrees to pay the Contractor at a rate of {{currency}}{{rate}} per {{period}}. Invoices shall be submitted monthly and are due within {{payment_days}} days of receipt.',
      },
      {
        heading: 'Term',
        body: 'This Agreement begins on {{date}} and continues until {{term_end}}, unless terminated earlier by either party with 14 days written notice.',
      },
      {
        heading: 'Independent Contractor Status',
        body: 'The Contractor is an independent contractor, not an employee of the Client. The Contractor is responsible for their own taxes, insurance, and benefits. The Client shall not withhold any taxes from payments to the Contractor.',
      },
      {
        heading: 'Intellectual Property',
        body: 'All work product, deliverables, and materials created by the Contractor under this Agreement shall be considered "work made for hire" and shall be the exclusive property of the Client upon full payment. To the extent any work does not qualify as work made for hire, the Contractor hereby assigns all rights, title, and interest to the Client.',
      },
      {
        heading: 'Confidentiality',
        body: 'The Contractor agrees to maintain strict confidentiality of all proprietary information, trade secrets, and business data of the Client disclosed during the term of this Agreement. This obligation survives termination of this Agreement.',
      },
      {
        heading: 'Limitation of Liability',
        body: "The Contractor's total liability under this Agreement shall not exceed the total fees paid to the Contractor in the 12 months preceding the claim. In no event shall either party be liable for indirect, incidental, or consequential damages.",
      },
      {
        heading: 'Termination',
        body: 'Either party may terminate this Agreement with 14 days written notice. The Client shall pay for all work completed up to the termination date. The Contractor shall deliver all completed and in-progress work upon termination.',
      },
      {
        heading: 'Governing Law',
        body: 'This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction where the Contractor operates.',
      },
    ],
  },

  sow: {
    name: 'Statement of Work (SOW)',
    category: 'project',
    vars: [
      { name: 'project', label: 'Project Name', type: 'text', placeholder: 'Website Redesign' },
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'contractor_name', label: 'Contractor', type: 'text', placeholder: 'Your Name' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'end_date', label: 'Estimated Completion', type: 'date' },
      {
        name: 'scope',
        label: 'Project Overview',
        type: 'textarea',
        placeholder: 'High-level description of the project...',
      },
      {
        name: 'deliverables',
        label: 'Deliverables',
        type: 'textarea',
        placeholder:
          '- Deliverable 1: Description\n- Deliverable 2: Description\n- Deliverable 3: Description',
      },
      {
        name: 'milestones',
        label: 'Milestones & Timeline',
        type: 'textarea',
        placeholder:
          'Phase 1 (Week 1-2): Discovery & Planning\nPhase 2 (Week 3-4): Design\nPhase 3 (Week 5-8): Development',
      },
      { name: 'currency', label: 'Currency', type: 'text', default: '$', placeholder: '$' },
      { name: 'total_fee', label: 'Total Fee', type: 'currency', placeholder: '15000' },
      {
        name: 'payment_schedule',
        label: 'Payment Schedule',
        type: 'textarea',
        default: '50% upon signing\n50% upon completion',
        placeholder: '',
      },
      {
        name: 'change_process',
        label: 'Change Request Process',
        type: 'textarea',
        default:
          'Any changes to scope require written approval from both parties. Changes may affect timeline and compensation. The Contractor will provide a written estimate for any proposed changes before work begins.',
        placeholder: '',
      },
    ],
    sections: [
      {
        heading: 'Project Overview',
        body: 'Project: {{project}}\nClient: {{client_name}}\nContractor: {{contractor_name}}\nDate: {{date}}\n\n{{scope}}',
      },
      { heading: 'Deliverables', body: '{{deliverables}}' },
      {
        heading: 'Timeline',
        body: 'Start Date: {{date}}\nEstimated Completion: {{end_date}}\n\n{{milestones}}',
      },
      {
        heading: 'Compensation',
        body: 'Total Project Fee: {{currency}}{{total_fee}}\n\nPayment Schedule:\n{{payment_schedule}}',
      },
      { heading: 'Change Requests', body: '{{change_process}}' },
      {
        heading: 'Acceptance',
        body: 'Both parties agree to the terms outlined in this Statement of Work. Work shall commence upon signed acceptance.',
      },
    ],
  },

  nda: {
    name: 'Non-Disclosure Agreement (NDA)',
    category: 'protection',
    vars: [
      {
        name: 'disclosing_party',
        label: 'Disclosing Party',
        type: 'text',
        placeholder: 'Client Corp',
      },
      { name: 'receiving_party', label: 'Receiving Party', type: 'text', placeholder: 'Your Name' },
      { name: 'date', label: 'Date', type: 'date' },
      {
        name: 'purpose',
        label: 'Purpose of Disclosure',
        type: 'textarea',
        placeholder:
          'To evaluate a potential business relationship for web development services...',
      },
      { name: 'term', label: 'Term (years)', type: 'text', default: '3', placeholder: '3' },
      {
        name: 'governing_law',
        label: 'Governing Law',
        type: 'text',
        placeholder: 'State of California',
      },
    ],
    sections: [
      {
        heading: 'Parties',
        body: 'This Non-Disclosure Agreement ("Agreement") is entered into on {{date}} between {{disclosing_party}} ("Disclosing Party") and {{receiving_party}} ("Receiving Party").',
      },
      {
        heading: 'Purpose',
        body: 'The parties wish to explore a potential business relationship. In connection with this purpose, the Disclosing Party may share confidential information with the Receiving Party.\n\n{{purpose}}',
      },
      {
        heading: 'Definition of Confidential Information',
        body: '"Confidential Information" means any non-public information disclosed by the Disclosing Party, including but not limited to: business plans, financial data, customer lists, technical specifications, trade secrets, software, designs, and any other proprietary information, whether disclosed orally, in writing, or by any other means.',
      },
      {
        heading: 'Obligations',
        body: 'The Receiving Party agrees to:\n\n1. Hold all Confidential Information in strict confidence\n2. Not disclose Confidential Information to any third parties without prior written consent\n3. Use Confidential Information solely for the stated Purpose\n4. Take reasonable measures to protect the confidentiality of the information\n5. Limit access to Confidential Information to employees and contractors who have a need to know and are bound by confidentiality obligations at least as restrictive as those herein',
      },
      {
        heading: 'Exclusions',
        body: 'This Agreement does not apply to information that:\n\n1. Is or becomes publicly available through no fault of the Receiving Party\n2. Was known to the Receiving Party prior to disclosure\n3. Is independently developed by the Receiving Party without use of Confidential Information\n4. Is rightfully received from a third party without restriction\n5. Is required to be disclosed by law or court order, provided the Receiving Party gives prompt notice to the Disclosing Party',
      },
      {
        heading: 'Return of Information',
        body: 'Upon termination of this Agreement or upon request, the Receiving Party shall promptly return or destroy all Confidential Information and any copies thereof, and shall certify such destruction in writing.',
      },
      {
        heading: 'Term',
        body: 'This Agreement remains in effect for {{term}} years from the date of disclosure. The obligations of confidentiality shall survive termination of this Agreement.',
      },
      {
        heading: 'Remedies',
        body: 'The Receiving Party acknowledges that unauthorized disclosure of Confidential Information may cause irreparable harm for which monetary damages would be inadequate. The Disclosing Party shall be entitled to seek injunctive relief in addition to any other remedies available at law or in equity.',
      },
      {
        heading: 'Governing Law',
        body: 'This Agreement shall be governed by the laws of {{governing_law}}.',
      },
    ],
  },

  payment: {
    name: 'Invoice Payment Terms',
    category: 'payment',
    vars: [
      { name: 'invoice_number', label: 'Invoice Number', type: 'text', placeholder: 'INV-001' },
      { name: 'date', label: 'Invoice Date', type: 'date' },
      { name: 'due_date', label: 'Due Date', type: 'date' },
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'payment_days', label: 'Net Days', type: 'text', default: '30', placeholder: '30' },
      {
        name: 'late_fee',
        label: 'Late Fee (% per month)',
        type: 'text',
        default: '1.5',
        placeholder: '1.5',
      },
      { name: 'email', label: 'Contact Email', type: 'text', placeholder: 'billing@company.com' },
      { name: 'bank_name', label: 'Bank Name', type: 'text', placeholder: 'First National Bank' },
      { name: 'account_number', label: 'Account Number', type: 'text', placeholder: '****1234' },
      { name: 'routing_number', label: 'Routing Number', type: 'text', placeholder: '021000021' },
      {
        name: 'paypal_email',
        label: 'PayPal Email',
        type: 'text',
        placeholder: 'payments@company.com',
      },
    ],
    sections: [
      {
        heading: 'Invoice Details',
        body: 'Invoice Number: {{invoice_number}}\nDate: {{date}}\nDue Date: {{due_date}}\nClient: {{client_name}}',
      },
      {
        heading: 'Payment Terms',
        body: 'Payment is due within {{payment_days}} days of the invoice date (Net {{payment_days}}). All amounts are in the currency specified on the invoice.',
      },
      {
        heading: 'Late Payment',
        body: "A late fee of {{late_fee}}% per month will be assessed on all balances not paid by the due date. The Client shall be responsible for all costs of collection, including reasonable attorney's fees.",
      },
      {
        heading: 'Payment Methods',
        body: 'Bank Transfer:\n  Bank: {{bank_name}}\n  Account: {{account_number}}\n  Routing: {{routing_number}}\n\nPayPal: {{paypal_email}}\n\nCheck: Please make payable to the name on the invoice and mail to the address provided.',
      },
      {
        heading: 'Disputes',
        body: 'Any disputes regarding the invoice must be raised in writing within 10 days of receipt. Undisputed portions remain due according to the original terms.',
      },
      { heading: 'Contact', body: 'For questions regarding this invoice, contact: {{email}}' },
    ],
  },

  signoff: {
    name: 'Project Sign-off',
    category: 'project',
    vars: [
      { name: 'project', label: 'Project Name', type: 'text', placeholder: 'Website Redesign' },
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'contractor_name', label: 'Contractor', type: 'text', placeholder: 'Your Name' },
      { name: 'date', label: 'Date', type: 'date' },
      {
        name: 'sow_reference',
        label: 'SOW / Contract Reference',
        type: 'text',
        placeholder: 'SOW-2025-001',
      },
      {
        name: 'deliverable_1',
        label: 'Deliverable 1',
        type: 'text',
        placeholder: 'Responsive Website',
      },
      {
        name: 'deliverable_1_status',
        label: 'Deliverable 1 Accepted',
        type: 'toggle',
        default: 'on',
      },
      { name: 'deliverable_2', label: 'Deliverable 2', type: 'text', placeholder: 'Design System' },
      {
        name: 'deliverable_2_status',
        label: 'Deliverable 2 Accepted',
        type: 'toggle',
        default: 'on',
      },
      {
        name: 'deliverable_3',
        label: 'Deliverable 3',
        type: 'text',
        placeholder: 'CMS Integration',
      },
      { name: 'deliverable_3_status', label: 'Deliverable 3 Accepted', type: 'toggle' },
      { name: 'deliverable_4', label: 'Deliverable 4', type: 'text', placeholder: '' },
      { name: 'deliverable_4_status', label: 'Deliverable 4 Accepted', type: 'toggle' },
      {
        name: 'acceptance_notes',
        label: 'Acceptance Notes',
        type: 'textarea',
        placeholder: 'Any notes on acceptance, outstanding items, or conditions...',
      },
      {
        name: 'final_payment',
        label: 'Final Payment Amount',
        type: 'currency',
        placeholder: '5000',
      },
      {
        name: 'final_payment_due',
        label: 'Final Payment Due (days)',
        type: 'text',
        default: '15',
        placeholder: '15',
      },
      {
        name: 'warranty_days',
        label: 'Warranty Period (days)',
        type: 'text',
        default: '30',
        placeholder: '30',
      },
      {
        name: 'warranty_scope',
        label: 'Warranty Scope',
        type: 'textarea',
        default:
          'Bug fixes for issues directly related to the delivered work. Does not cover new feature requests, changes in scope, or issues caused by third-party services or client modifications.',
        placeholder: '',
      },
    ],
    sections: [
      {
        heading: 'Project Information',
        body: 'Project: {{project}}\nClient: {{client_name}}\nContractor: {{contractor_name}}\nDate: {{date}}\nReference: {{sow_reference}}',
      },
      {
        heading: 'Deliverables Acceptance',
        body: 'The Client confirms acceptance of the following deliverables:\n\n{{#if deliverable_1_status}}✓ {{deliverable_1}}\n{{/if}}{{#if deliverable_2_status}}✓ {{deliverable_2}}\n{{/if}}{{#if deliverable_3_status}}✓ {{deliverable_3}}\n{{/if}}{{#if deliverable_4_status}}✓ {{deliverable_4}}\n{{/if}}',
      },
      { heading: 'Acceptance Notes', body: '{{acceptance_notes}}' },
      {
        heading: 'Final Payment',
        body: 'A final payment of {{currency}}{{final_payment}} is due within {{final_payment_due}} days of this sign-off. Failure to remit payment within this period may result in late fees as outlined in the original agreement.',
      },
      {
        heading: 'Warranty',
        body: 'The Contractor provides a warranty period of {{warranty_days}} days from the date of this sign-off.\n\n{{warranty_scope}}',
      },
      {
        heading: 'Signatures',
        body: 'By signing below, both parties agree that the project has been completed and accepted per the terms of the original agreement.\n\nContractor Signature: _________________________ Date: ___________\n\nClient Signature: _________________________ Date: ___________',
      },
    ],
  },

  msa: {
    name: 'Master Services Agreement',
    category: 'agreements',
    vars: [
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      {
        name: 'client_address',
        label: 'Client Address',
        type: 'text',
        placeholder: '123 Main St, City, State',
      },
      {
        name: 'contractor_name',
        label: 'Contractor',
        type: 'text',
        placeholder: 'Your Name / Company',
      },
      {
        name: 'contractor_address',
        label: 'Contractor Address',
        type: 'text',
        placeholder: '456 Oak Ave, City, State',
      },
      { name: 'date', label: 'Effective Date', type: 'date' },
      {
        name: 'services',
        label: 'Description of Services',
        type: 'textarea',
        placeholder: 'Web development, design, consulting, and related technical services...',
      },
      { name: 'rate', label: 'Standard Rate', type: 'currency', placeholder: '150' },
      { name: 'period', label: 'Rate Period', type: 'text', default: 'hour', placeholder: 'hour' },
      {
        name: 'payment_days',
        label: 'Payment Terms (days)',
        type: 'text',
        default: '30',
        placeholder: '30',
      },
      {
        name: 'late_fee',
        label: 'Late Fee (% per month)',
        type: 'text',
        default: '1.5',
        placeholder: '1.5',
      },
      {
        name: 'liability_cap',
        label: 'Liability Cap (months of fees)',
        type: 'text',
        default: '12',
        placeholder: '12',
      },
      {
        name: 'notice_days',
        label: 'Termination Notice (days)',
        type: 'text',
        default: '30',
        placeholder: '30',
      },
      {
        name: 'cure_days',
        label: 'Cure Period (days)',
        type: 'text',
        default: '15',
        placeholder: '15',
      },
      {
        name: 'governing_law',
        label: 'Governing Law',
        type: 'text',
        placeholder: 'State of California',
      },
      {
        name: 'arbitration_location',
        label: 'Arbitration Location',
        type: 'text',
        placeholder: 'San Francisco, CA',
      },
    ],
    sections: [
      {
        heading: 'Parties',
        body: 'This Master Services Agreement ("Agreement") is entered into as of {{date}} between:\n\n{{client_name}}, with principal offices at {{client_address}} ("Client")\n\nand\n\n{{contractor_name}}, with principal offices at {{contractor_address}} ("Contractor").',
      },
      {
        heading: '1. Services',
        body: '1.1 The Contractor agrees to provide the following services to the Client: {{services}}\n\n1.2 Specific projects shall be governed by individual Statements of Work ("SOW") executed under this Agreement.\n\n1.3 In the event of a conflict between this Agreement and any SOW, the SOW shall control.',
      },
      {
        heading: '2. Compensation',
        body: '2.1 The Client shall pay the Contractor at a rate of {{currency}}{{rate}} per {{period}}.\n\n2.2 Invoices shall be submitted monthly and are due within {{payment_days}} days of receipt.\n\n2.3 A late fee of {{late_fee}}% per month shall be assessed on overdue balances.',
      },
      {
        heading: '3. Intellectual Property',
        body: 'All work product created by the Contractor under this Agreement shall be considered "work made for hire." To the extent any work does not qualify, the Contractor hereby assigns all rights, title, and interest to the Client.',
      },
      {
        heading: '4. Confidentiality',
        body: 'Each party agrees to maintain the confidentiality of all proprietary and confidential information disclosed by the other party. These obligations survive termination for 3 years.',
      },
      {
        heading: '5. Limitation of Liability',
        body: "THE CONTRACTOR'S TOTAL LIABILITY SHALL NOT EXCEED THE TOTAL FEES PAID IN THE {{liability_cap}} MONTHS PRECEDING THE CLAIM. NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.",
      },
      {
        heading: '6. Term and Termination',
        body: 'This Agreement commences on {{date}} and continues until terminated. Either party may terminate with {{notice_days}} days written notice, or for cause with {{cure_days}} days cure period.',
      },
      {
        heading: '7. Governing Law',
        body: 'This Agreement shall be governed by the laws of {{governing_law}}. Disputes shall be resolved by binding arbitration in {{arbitration_location}}.',
      },
    ],
  },

  sla: {
    name: 'Service Level Agreement',
    category: 'protection',
    vars: [
      {
        name: 'provider_name',
        label: 'Service Provider',
        type: 'text',
        placeholder: 'Your Company',
      },
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'date', label: 'Effective Date', type: 'date' },
      {
        name: 'service_description',
        label: 'Service Description',
        type: 'textarea',
        placeholder: 'Website hosting, maintenance, and technical support...',
      },
      {
        name: 'uptime_guarantee',
        label: 'Uptime Guarantee (%)',
        type: 'text',
        default: '99.9',
        placeholder: '99.9',
      },
      {
        name: 'response_critical',
        label: 'Critical Issue Response (hours)',
        type: 'text',
        default: '1',
        placeholder: '1',
      },
      {
        name: 'response_high',
        label: 'High Priority Response (hours)',
        type: 'text',
        default: '4',
        placeholder: '4',
      },
      {
        name: 'response_normal',
        label: 'Normal Response (hours)',
        type: 'text',
        default: '8',
        placeholder: '8',
      },
      {
        name: 'response_low',
        label: 'Low Response (hours)',
        type: 'text',
        default: '24',
        placeholder: '24',
      },
      {
        name: 'resolution_critical',
        label: 'Critical Resolution (hours)',
        type: 'text',
        default: '4',
        placeholder: '4',
      },
      {
        name: 'resolution_high',
        label: 'High Resolution (hours)',
        type: 'text',
        default: '24',
        placeholder: '24',
      },
      {
        name: 'resolution_normal',
        label: 'Normal Resolution (hours)',
        type: 'text',
        default: '72',
        placeholder: '72',
      },
      {
        name: 'support_hours',
        label: 'Support Hours',
        type: 'text',
        default: 'Monday-Friday 9AM-6PM EST',
        placeholder: '',
      },
      {
        name: 'support_channel',
        label: 'Support Channel',
        type: 'text',
        placeholder: 'support@company.com',
      },
      {
        name: 'credit_1',
        label: 'Credit for 95-99% uptime (%)',
        type: 'text',
        default: '10',
        placeholder: '10',
      },
      {
        name: 'credit_2',
        label: 'Credit for below 95% uptime (%)',
        type: 'text',
        default: '25',
        placeholder: '25',
      },
      {
        name: 'review_frequency',
        label: 'Review Frequency',
        type: 'text',
        default: 'Monthly',
        placeholder: 'Monthly',
      },
    ],
    sections: [
      {
        heading: 'Parties',
        body: 'This Service Level Agreement is entered into as of {{date}} between {{provider_name}} ("Provider") and {{client_name}} ("Client").',
      },
      { heading: 'Service Description', body: '{{service_description}}' },
      {
        heading: 'Service Levels',
        body: 'Uptime Guarantee: {{uptime_guarantee}}%\n\nScheduled Maintenance: 48 hours notice, max 4 hours/month.',
      },
      {
        heading: 'Response & Resolution',
        body: 'Critical: {{response_critical}}h response, {{resolution_critical}}h resolution\nHigh: {{response_high}}h response, {{resolution_high}}h resolution\nNormal: {{response_normal}}h response, {{resolution_normal}}h resolution',
      },
      {
        heading: 'Service Credits',
        body: '{{credit_1}}% credit for 95-{{uptime_guarantee}}% uptime\n{{credit_2}}% credit for below 95% uptime\n\nTotal credits capped at 50% of monthly fee.',
      },
    ],
  },

  subcontractor: {
    name: 'Subcontractor Agreement',
    category: 'agreements',
    vars: [
      {
        name: 'contractor_name',
        label: 'Primary Contractor',
        type: 'text',
        placeholder: 'Your Name / Company',
      },
      { name: 'sub_name', label: 'Subcontractor', type: 'text', placeholder: 'Subcontractor Name' },
      { name: 'date', label: 'Date', type: 'date' },
      {
        name: 'project',
        label: 'Project',
        type: 'text',
        placeholder: 'Client Corp Website Redesign',
      },
      {
        name: 'scope',
        label: 'Scope of Work',
        type: 'textarea',
        placeholder: 'Description of work...',
      },
      {
        name: 'deliverables',
        label: 'Deliverables',
        type: 'textarea',
        placeholder: '- Frontend development\n- Responsive implementation',
      },
      { name: 'start_date', label: 'Start Date', type: 'date' },
      { name: 'end_date', label: 'End Date', type: 'date' },
      { name: 'rate', label: 'Rate', type: 'currency', placeholder: '100' },
      { name: 'period', label: 'Rate Period', type: 'text', default: 'hour', placeholder: 'hour' },
      {
        name: 'payment_days',
        label: 'Payment Terms (days)',
        type: 'text',
        default: '15',
        placeholder: '15',
      },
      { name: 'client_name', label: 'End Client', type: 'text', placeholder: 'Client Corp' },
      {
        name: 'non_solicit_months',
        label: 'Non-Solicitation (months)',
        type: 'text',
        default: '12',
        placeholder: '12',
      },
      {
        name: 'notice_days',
        label: 'Termination Notice (days)',
        type: 'text',
        default: '14',
        placeholder: '14',
      },
    ],
    sections: [
      {
        heading: 'Parties',
        body: 'This Subcontractor Agreement is entered into as of {{date}} between {{contractor_name}} ("Contractor") and {{sub_name}} ("Subcontractor").',
      },
      {
        heading: 'Engagement',
        body: 'The Contractor engages the Subcontractor for the {{project}} project for {{client_name}}. The Subcontractor is an independent contractor.',
      },
      { heading: 'Scope', body: '{{scope}}\n\nDeliverables:\n{{deliverables}}' },
      { heading: 'Timeline', body: 'Start: {{start_date}}\nEnd: {{end_date}}' },
      {
        heading: 'Compensation',
        body: '{{currency}}{{rate}} per {{period}}\nPayment: Net {{payment_days}} days',
      },
      {
        heading: 'Intellectual Property',
        body: 'All work product is assigned to the Contractor upon full payment.',
      },
      {
        heading: 'Confidentiality',
        body: 'The Subcontractor agrees to maintain strict confidentiality of all project information.',
      },
      {
        heading: 'Non-Solicitation',
        body: "For {{non_solicit_months}} months after termination, the Subcontractor shall not solicit the Client or the Contractor's employees.",
      },
      {
        heading: 'Termination',
        body: 'Either party may terminate with {{notice_days}} days written notice. Immediate termination for cause is permitted.',
      },
    ],
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  agreements: 'Agreements',
  project: 'Project Documents',
  protection: 'Protection',
  payment: 'Payment',
};

function renderVarInput(v: TemplateVar, currencySymbol: string): string {
  const id = `fcct-${v.name}`;
  const label = `<label class="label">${v.label}</label>`;
  switch (v.type) {
    case 'textarea':
      return `<div class="fcct-var fcct-var--full">${label}<textarea class="input input--textarea fcct-input" data-var="${v.name}" data-type="textarea" id="${id}" placeholder="${v.placeholder || ''}" rows="3">${v.default || ''}</textarea></div>`;
    case 'date':
      return `<div class="fcct-var">${label}<input type="date" class="input fcct-input" data-var="${v.name}" data-type="date" id="${id}" value="${v.default || ''}"></div>`;
    case 'currency':
      return `<div class="fcct-var">${label}<div class="fcct-currency-wrap"><span class="fcct-currency-sym">${currencySymbol}</span><input type="text" class="input fcct-input fcct-currency-input" data-var="${v.name}" data-type="currency" id="${id}" placeholder="${v.placeholder || ''}" value="${v.default || ''}"></div></div>`;
    case 'toggle':
      return `<div class="fcct-var"><label class="fcct-toggle"><input type="checkbox" class="fcct-input" data-var="${v.name}" data-type="toggle" id="${id}"${v.default === 'on' ? ' checked' : ''}><span>${v.label}</span></label></div>`;
    default:
      return `<div class="fcct-var">${label}<input type="text" class="input fcct-input" data-var="${v.name}" data-type="text" id="${id}" placeholder="${v.placeholder || ''}" value="${v.default || ''}"></div>`;
  }
}

export class ContractTemplates {
  id = 'contract-templates';
  name = 'Contract Templates';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M9 15l2 2 4-4"/>
    </svg>`;

  private templateSelect!: HTMLSelectElement;
  private previewEl!: HTMLDivElement;
  private varsContainer!: HTMLDivElement;
  private currentVars: Record<string, string> = {};
  private currencySymbol = '$';
  private watermarkText = '';
  private root!: HTMLElement;

  render(): string {
    const grouped: Record<string, [string, TemplateDef][]> = {};
    for (const [k, v] of Object.entries(TEMPLATES)) {
      (grouped[v.category] ??= []).push([k, v]);
    }

    const opts = Object.entries(CATEGORY_LABELS)
      .filter(([k]) => grouped[k])
      .map(
        ([cat, label]) =>
          `<optgroup label="${label}">${grouped[cat].map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</optgroup>`,
      )
      .join('');

    return `
      <div class="fcct-layout">
        <div class="fcct-form" id="fcct-form-col">
          <div class="fcct-branding">
            <div class="form-group">
              <label class="label">Watermark</label>
              <input type="text" class="input" id="fcct-watermark" placeholder="e.g. CONFIDENTIAL, DRAFT">
            </div>
          </div>
          <div class="form-group">
            <label class="label">Template</label>
            <select class="input" id="fcct-template">${opts}</select>
          </div>
          <div class="fcct-vars-grid" id="fcct-vars"></div>
          <div class="tool-actions fcct-export-actions">
            <button class="btn btn--primary" id="fcct-done">Done & Preview</button>
          </div>
        </div>
        <div class="fcct-preview-col">
          <div class="fcct-preview-header">
            <button class="btn btn--ghost btn--sm" id="fcct-fullscreen">Full Screen</button>
          </div>
          <div class="fcct-preview-body">
            <div class="fcct-paper">
              <div class="fcct-paper__inner" id="fcct-preview"></div>
            </div>
            <div class="fcct-preview-mode" id="fcct-preview-mode" style="display:none;">
              <div class="fcct-preview-mode__header">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <h3>Document Ready</h3>
                <p class="pdf-note">Need signatures? Use the PDF Signature tool after downloading.</p>
              </div>
              <div class="fcct-preview-mode__actions">
                <button class="btn btn--primary" id="fcct-export-pdf">Download PDF</button>
                <button class="btn btn--ghost" id="fcct-export-docx">Download DOCX</button>
                <button class="btn btn--ghost" id="fcct-copy">Copy Formatted</button>
              </div>
              <button class="btn btn--ghost btn--sm" id="fcct-edit-again">Edit Again</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.root = root;
    this.templateSelect = root.querySelector('#fcct-template')!;
    this.previewEl = root.querySelector('#fcct-preview')!;
    this.varsContainer = root.querySelector('#fcct-vars')!;

    const defaultCurrency = (await db.getPreference('defaultCurrency', 'USD')) as string;
    this.currencySymbol = getCurrencySymbol(defaultCurrency || 'USD');

    wireSharedInputs(root);

    this.templateSelect.addEventListener('change', () => {
      this.currentVars = {};
      this.renderVars();
      this.updatePreview();
    });

    root.querySelector('#fcct-copy')!.addEventListener('click', () => this.copyFormatted());
    root.querySelector('#fcct-export-pdf')!.addEventListener('click', () => this.exportPDF());
    root.querySelector('#fcct-export-docx')!.addEventListener('click', () => this.exportDOCX());
    root.querySelector('#fcct-done')!.addEventListener('click', () => this.enterPreviewMode());
    root.querySelector('#fcct-edit-again')!.addEventListener('click', () => this.exitPreviewMode());

    // Watermark
    const watermarkInput = root.querySelector('#fcct-watermark') as HTMLInputElement;
    watermarkInput.addEventListener('input', () => {
      this.watermarkText = watermarkInput.value;
      this.updatePreviewDebounced();
    });

    // Full screen preview
    root
      .querySelector('#fcct-fullscreen')
      ?.addEventListener('click', () => this.openFullScreenPreview());

    this.renderVars();
    this.updatePreview();
  }

  private renderVars(): void {
    const def = TEMPLATES[this.templateSelect.value];
    this.varsContainer.innerHTML = def.vars
      .map((v) => renderVarInput(v, this.currencySymbol))
      .join('');

    this.varsContainer.querySelectorAll('.fcct-input').forEach((el) => {
      const input = el as HTMLInputElement;
      const varName = input.dataset.var!;
      const varType = input.dataset.type;
      const handler = () => {
        if (varType === 'toggle') {
          this.currentVars[varName] = (input as HTMLInputElement).checked ? 'on' : '';
        } else {
          this.currentVars[varName] = input.value;
        }
        this.updatePreviewDebounced();
      };
      input.addEventListener(varType === 'toggle' ? 'change' : 'input', handler);
    });
  }

  private updatePreviewDebounced = (() => {
    let timer: ReturnType<typeof setTimeout>;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => this.updatePreview(), 150);
    };
  })();

  private updatePreview(): void {
    const def = TEMPLATES[this.templateSelect.value];
    const docTitle = def.name.toUpperCase();

    const dateVal = this.currentVars['date'] || '';
    const formattedDate = dateVal
      ? new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';
    const clientName =
      this.currentVars['client_name'] || this.currentVars['disclosing_party'] || '';
    const parties = clientName ? `Prepared for: ${clientName}` : '';

    const headerBlock = `
      <div class="fcct-paper__header">
        <div class="fcct-paper__header-text">
          <h1>${docTitle}</h1>
          ${formattedDate ? `<p class="fcct-paper__date">${formattedDate}</p>` : ''}
          ${parties ? `<p class="fcct-paper__parties">${parties}</p>` : ''}
        </div>
      </div>`;

    const PAGE_HEIGHT = 1000;
    let cumHeight = 0;
    let pageNum = 1;
    const sectionsHtml = def.sections
      .map((s) => {
        let body = s.body;
        body = this.processConditionals(body);
        body = this.substituteVars(body);
        body = this.formatBody(body);
        const sectionHtml = `<div class="fcct-section"><h2>${s.heading}</h2>${body}</div>`;
        const estHeight = 40 + body.split('\n').length * 18;
        cumHeight += estHeight;
        if (cumHeight > PAGE_HEIGHT) {
          pageNum++;
          cumHeight = estHeight;
          return `<div class="fcct-page-break">— Page ${pageNum} —</div>${sectionHtml}`;
        }
        return sectionHtml;
      })
      .join('');

    const allContent = headerBlock + sectionsHtml;
    const pageBreakRegex = /<div class="fcct-page-break">[^<]*<\/div>/;
    const chunks = allContent.split(pageBreakRegex);

    const watermarkOverlay = this.watermarkText
      ? `<div class="fcct-watermark"><span class="fcct-watermark-text">${escapeHtml(this.watermarkText)}</span></div>`
      : '';

    const pagesHtml = chunks
      .map(
        (chunk, i) =>
          `<div class="fcct-page">${watermarkOverlay}<div class="fcct-page__inner">${chunk}</div></div>`,
      )
      .join('');

    this.previewEl.innerHTML = pagesHtml;

    // Scale pages to fit container
    const paperEl = this.previewEl.closest('.fcct-paper') as HTMLElement;
    if (paperEl) {
      const containerWidth = paperEl.clientWidth - 64;
      const pageWidthPx = 794;
      const scale = Math.min(1, Math.max(0.65, containerWidth / pageWidthPx));

      this.previewEl.querySelectorAll('.fcct-page').forEach((page) => {
        const el = page as HTMLElement;
        el.style.transform = `scale(${scale})`;
        el.style.transformOrigin = 'top center';
        const actualHeight = el.offsetHeight;
        const marginBottom = -(actualHeight * (1 - scale));
        el.style.marginBottom = `${marginBottom}px`;
      });
    }
  }

  private enterPreviewMode(): void {
    const sidebar = this.root.querySelector('#fcct-form-col') as HTMLElement;
    if (sidebar) sidebar.style.display = 'none';
    const fsBtn = this.root.querySelector('#fcct-fullscreen') as HTMLElement;
    if (fsBtn) fsBtn.style.display = 'none';
    const previewMode = this.root.querySelector('#fcct-preview-mode') as HTMLElement;
    if (previewMode) previewMode.style.display = '';
  }

  private exitPreviewMode(): void {
    const sidebar = this.root.querySelector('#fcct-form-col') as HTMLElement;
    if (sidebar) sidebar.style.display = '';
    const fsBtn = this.root.querySelector('#fcct-fullscreen') as HTMLElement;
    if (fsBtn) fsBtn.style.display = '';
    const previewMode = this.root.querySelector('#fcct-preview-mode') as HTMLElement;
    if (previewMode) previewMode.style.display = 'none';
    this.updatePreview();
  }

  private openFullScreenPreview(): void {
    const modal = document.createElement('div');
    modal.className = 'fcct-modal';
    modal.innerHTML = `
      <div class="fcct-modal__overlay"></div>
      <div class="fcct-modal__content">
        <button class="btn btn--ghost btn--sm fcct-modal__close">×</button>
        <div class="fcct-modal__paper">${this.previewEl.innerHTML}</div>
      </div>`;

    document.body.appendChild(modal);
    const close = () => {
      modal.remove();
      document.removeEventListener('keydown', onEsc);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    modal.querySelector('.fcct-modal__overlay')!.addEventListener('click', close);
    modal.querySelector('.fcct-modal__close')!.addEventListener('click', close);
    document.addEventListener('keydown', onEsc);
  }

  private processConditionals(text: string): string {
    return text.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
      return this.currentVars[varName] ? content : '';
    });
  }

  private substituteVars(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = this.currentVars[key];
      if (key === 'currency') return escapeHtml(val || this.currencySymbol);
      return escapeHtml(val || `{{${key}}}`);
    });
  }

  private formatBody(text: string): string {
    return text
      .split('\n\n')
      .map((p) => {
        if (p.startsWith('- ') || p.startsWith('1. ') || p.startsWith('✓ ')) {
          const items = p
            .split('\n')
            .map((line) => `<li>${line.replace(/^[-\d.]+\s*|^✓\s*/, '')}</li>`)
            .join('');
          return `<ul>${items}</ul>`;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      })
      .join('');
  }

  private async copyFormatted(): Promise<void> {
    try {
      const html = this.previewEl.innerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const text = this.previewEl.innerText;
      const textBlob = new Blob([text], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob }),
      ]);
      Toast.copied('Contract');
      logToolAction('contract-templates', 'Copied formatted contract');
    } catch {
      await copyToClipboard(this.previewEl.innerText);
      Toast.copied('Contract (plain text)');
    }
  }

  private async exportPDF(): Promise<void> {
    const exportBtn = this.root.querySelector('#fcct-export-pdf') as HTMLButtonElement;
    exportBtn.disabled = true;
    exportBtn.textContent = 'Generating PDF...';

    try {
      const def = TEMPLATES[this.templateSelect.value];
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique);
      const wmFont = await pdf.embedFont(StandardFonts.TimesRoman);

      // ponytail: WinAnsiEncoding only — replace non-Latin-1 symbols with codes
      const safe = (s: string) =>
        s.replace(/[^\x00-\xFF]/g, (c) => {
          const map: Record<string, string> = {
            '€': 'EUR',
            '₹': 'INR',
            '₩': 'KRW',
            '₱': 'PHP',
            '฿': 'THB',
          };
          return map[c] || '?';
        });

      let page = pdf.addPage([595, 842]);
      const { width, height } = page.getSize();
      const margin = 50;
      const maxWidth = width - margin * 2;
      let y = height - margin;

      const drawWatermark = (targetPage: any) => {
        if (!this.watermarkText) return;
        const wmText = safe(this.watermarkText.toUpperCase());
        const wmSize = 72;
        const wmWidth = wmFont.widthOfTextAtSize(wmText, wmSize);
        targetPage.drawText(wmText, {
          x: width / 2 - wmWidth / 2,
          y: height / 2,
          size: wmSize,
          font: wmFont,
          color: rgb(0, 0, 0),
          opacity: 0.06,
          rotate: degrees(-45),
        });
      };

      const checkPage = (needed: number) => {
        if (y - needed < margin) {
          page = pdf.addPage([595, 842]);
          y = height - margin;
          drawWatermark(page);
        }
      };

      const drawWrapped = (
        text: string,
        x: number,
        size: number,
        isBold = false,
        isItalic = false,
      ): number => {
        const f = isBold ? boldFont : isItalic ? italicFont : font;
        const words = safe(text).split(' ');
        let line = '';
        let lineCount = 0;
        for (const word of words) {
          const test = line ? line + ' ' + word : word;
          const testWidth = f.widthOfTextAtSize(test, size);
          if (testWidth > maxWidth && line) {
            checkPage(size * 1.5);
            page.drawText(line, { x, y, size, font: f, color: rgb(0, 0, 0) });
            y -= size * 1.5;
            line = word;
            lineCount++;
          } else {
            line = test;
          }
        }
        if (line) {
          checkPage(size * 1.5);
          page.drawText(line, { x, y, size, font: f, color: rgb(0, 0, 0) });
          y -= size * 1.5;
          lineCount++;
        }
        return lineCount;
      };

      // Draw watermark on first page
      drawWatermark(page);

      // Header
      checkPage(30);
      const titleWidth = boldFont.widthOfTextAtSize(def.name.toUpperCase(), 18);
      page.drawText(safe(def.name.toUpperCase()), {
        x: width / 2 - titleWidth / 2,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 25;

      // Date and parties
      const dateVal = this.currentVars['date'] || '';
      const formattedDate = dateVal
        ? new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '';
      const clientName =
        this.currentVars['client_name'] || this.currentVars['disclosing_party'] || '';

      if (formattedDate) {
        checkPage(16);
        page.drawText(safe(formattedDate), {
          x: margin,
          y,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        y -= 14;
      }
      if (clientName) {
        checkPage(16);
        page.drawText(safe(`Prepared for: ${clientName}`), {
          x: margin,
          y,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        y -= 14;
      }

      // Divider
      y -= 5;
      checkPage(10);
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1.5,
        color: rgb(0, 0, 0),
      });
      y -= 20;

      // Sections
      for (const section of def.sections) {
        let body = section.body;
        body = this.processConditionals(body);
        body = this.substituteVars(body);

        checkPage(24);
        page.drawText(section.heading.toUpperCase(), {
          x: margin,
          y,
          size: 11,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 5;
        page.drawLine({
          start: { x: margin, y },
          end: { x: width - margin, y },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85),
        });
        y -= 14;

        const paragraphs = body.split('\n\n');
        for (const para of paragraphs) {
          const lines = para.split('\n');
          for (const rawLine of lines) {
            const trimmed = rawLine.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('✓ ')) {
              checkPage(14);
              page.drawText(trimmed, { x: margin + 8, y, size: 10, font, color: rgb(0, 0, 0) });
              y -= 14;
            } else if (trimmed.startsWith('- ')) {
              const itemText = trimmed.replace(/^- /, '');
              checkPage(14);
              page.drawText('•', { x: margin + 4, y, size: 10, font, color: rgb(0, 0, 0) });
              drawWrapped(itemText, margin + 16, 10);
            } else if (/^\d+\./.test(trimmed)) {
              const itemText = trimmed.replace(/^\d+\.\s*/, '');
              const num = trimmed.match(/^(\d+)\./)?.[1] || '';
              checkPage(14);
              page.drawText(`${num}.`, { x: margin + 8, y, size: 10, font, color: rgb(0, 0, 0) });
              drawWrapped(itemText, margin + 24, 10);
            } else {
              drawWrapped(trimmed, margin, 10);
            }
          }
          y -= 6;
        }
        y -= 8;
      }

      stampPdfMetadata(pdf);
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const name = def.name.replace(/\s+/g, '-').toLowerCase();
      downloadBlob(blob, `${name}.pdf`);
      logDownload('contract-templates', 'Contract Templates', blob, `${name}.pdf`);
      logToolAction('contract-templates', 'Exported contract as PDF');
      Toast.success('PDF downloaded');
    } catch (e) {
      console.error('PDF export failed:', e);
      Toast.error('PDF export failed');
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Download PDF';
    }
  }

  private exportDOCX(): void {
    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<title>${TEMPLATES[this.templateSelect.value].name}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #1a1a1a; }
  h1 { font-size: 16pt; text-align: center; text-transform: uppercase; letter-spacing: 2pt; margin-bottom: 18pt; border-bottom: 2pt solid #1a1a1a; padding-bottom: 10pt; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 1pt; margin: 14pt 0 6pt; color: #333; border-bottom: 1pt solid #ccc; padding-bottom: 3pt; }
  p { margin: 4pt 0; }
  ul { margin: 4pt 0 4pt 18pt; }
  li { margin: 2pt 0; }
</style></head><body>${this.previewEl.innerHTML}</body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-word' });
    const name = TEMPLATES[this.templateSelect.value].name.replace(/\s+/g, '-').toLowerCase();
    downloadBlob(blob, `${name}.doc`);
    Toast.success('DOCX exported');
    logToolAction('contract-templates', 'Exported contract as DOCX');
  }

  destroy(): void {}
}

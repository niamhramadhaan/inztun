import { Toast } from '../../../components/Toast';
import { db } from '../../../core/db';
import { wireSharedInputs } from '../../../core/shared-inputs';
import { getCurrencySymbol } from '../../../components/SettingsPanel';
import { logToolAction } from '../../../core/activity';
import { downloadBlob } from '../../../utils/image';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

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
  hasSignature: boolean;
  vars: TemplateVar[];
  sections: Section[];
}

const TEMPLATES: Record<string, TemplateDef> = {
  proposal: {
    name: 'Project Proposal',
    category: 'project',
    hasSignature: true,
    vars: [
      { name: 'company_name', label: 'Your Company', type: 'text', placeholder: 'Acme Studio' },
      { name: 'client_name', label: 'Client Name', type: 'text', placeholder: 'Client Corp' },
      { name: 'project_title', label: 'Project Title', type: 'text', placeholder: 'Website Redesign' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'executive_summary', label: 'Executive Summary', type: 'textarea', placeholder: 'Brief overview of the project and your approach...' },
      { name: 'objectives', label: 'Objectives', type: 'textarea', placeholder: '- Increase conversion by 20%\n- Improve mobile experience\n- Modernize brand presence' },
      { name: 'scope', label: 'Scope of Work', type: 'textarea', placeholder: 'Detailed description of what is included...' },
      { name: 'deliverables', label: 'Deliverables', type: 'textarea', placeholder: '- Responsive website (5 pages)\n- Design system\n- CMS integration' },
      { name: 'timeline', label: 'Timeline', type: 'textarea', placeholder: 'Week 1-2: Discovery\nWeek 3-4: Design\nWeek 5-8: Development' },
      { name: 'budget', label: 'Total Budget', type: 'currency', placeholder: '15000' },
      { name: 'payment_schedule', label: 'Payment Schedule', type: 'textarea', default: '50% upon signing\n50% upon completion', placeholder: '' },
      { name: 'assumptions', label: 'Assumptions & Exclusions', type: 'textarea', placeholder: '- Client provides all content\n- Up to 2 rounds of revisions\n- Hosting not included' },
      { name: 'validity_days', label: 'Proposal Validity (days)', type: 'text', default: '30', placeholder: '30' },
      { name: 'email', label: 'Contact Email', type: 'text', placeholder: 'hello@acme.studio' },
    ],
    sections: [
      { heading: 'Executive Summary', body: '{{executive_summary}}' },
      { heading: 'Objectives', body: '{{objectives}}' },
      { heading: 'Scope of Work', body: '{{scope}}' },
      { heading: 'Deliverables', body: '{{deliverables}}' },
      { heading: 'Timeline', body: '{{timeline}}' },
      { heading: 'Investment', body: 'Total project fee: {{currency}}{{budget}}\n\nPayment Schedule:\n{{payment_schedule}}' },
      { heading: 'Assumptions & Exclusions', body: '{{assumptions}}' },
      { heading: 'Terms', body: 'This proposal is valid for {{validity_days}} days from the date above. Upon acceptance, a formal agreement will be executed.\n\nFor questions, contact: {{email}}' },
    ],
  },

  contractor: {
    name: 'Independent Contractor Agreement',
    category: 'agreements',
    hasSignature: false,
    vars: [
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'contractor_name', label: 'Contractor', type: 'text', placeholder: 'Your Name / Company' },
      { name: 'date', label: 'Effective Date', type: 'date' },
      { name: 'scope', label: 'Scope of Services', type: 'textarea', placeholder: 'Description of services to be provided...' },
      { name: 'rate', label: 'Rate', type: 'currency', placeholder: '150' },
      { name: 'period', label: 'Rate Period', type: 'text', default: 'hour', placeholder: 'hour / day / project' },
      { name: 'payment_days', label: 'Payment Terms (days)', type: 'text', default: '30', placeholder: '30' },
      { name: 'term_end', label: 'Agreement End Date', type: 'date' },
    ],
    sections: [
      { heading: 'Parties', body: 'This Independent Contractor Agreement ("Agreement") is entered into as of {{date}} between {{client_name}} ("Client") and {{contractor_name}} ("Contractor").' },
      { heading: 'Scope of Services', body: 'The Contractor agrees to provide the following services:\n\n{{scope}}' },
      { heading: 'Compensation', body: 'The Client agrees to pay the Contractor at a rate of {{currency}}{{rate}} per {{period}}. Invoices shall be submitted monthly and are due within {{payment_days}} days of receipt.' },
      { heading: 'Term', body: 'This Agreement begins on {{date}} and continues until {{term_end}}, unless terminated earlier by either party with 14 days written notice.' },
      { heading: 'Independent Contractor Status', body: 'The Contractor is an independent contractor, not an employee of the Client. The Contractor is responsible for their own taxes, insurance, and benefits. The Client shall not withhold any taxes from payments to the Contractor.' },
      { heading: 'Intellectual Property', body: 'All work product, deliverables, and materials created by the Contractor under this Agreement shall be considered "work made for hire" and shall be the exclusive property of the Client upon full payment. To the extent any work does not qualify as work made for hire, the Contractor hereby assigns all rights, title, and interest to the Client.' },
      { heading: 'Confidentiality', body: 'The Contractor agrees to maintain strict confidentiality of all proprietary information, trade secrets, and business data of the Client disclosed during the term of this Agreement. This obligation survives termination of this Agreement.' },
      { heading: 'Limitation of Liability', body: 'The Contractor\'s total liability under this Agreement shall not exceed the total fees paid to the Contractor in the 12 months preceding the claim. In no event shall either party be liable for indirect, incidental, or consequential damages.' },
      { heading: 'Termination', body: 'Either party may terminate this Agreement with 14 days written notice. The Client shall pay for all work completed up to the termination date. The Contractor shall deliver all completed and in-progress work upon termination.' },
      { heading: 'Governing Law', body: 'This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction where the Contractor operates.' },
    ],
  },

  sow: {
    name: 'Statement of Work (SOW)',
    category: 'project',
    hasSignature: false,
    vars: [
      { name: 'project', label: 'Project Name', type: 'text', placeholder: 'Website Redesign' },
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'contractor_name', label: 'Contractor', type: 'text', placeholder: 'Your Name' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'end_date', label: 'Estimated Completion', type: 'date' },
      { name: 'scope', label: 'Project Overview', type: 'textarea', placeholder: 'High-level description of the project...' },
      { name: 'deliverables', label: 'Deliverables', type: 'textarea', placeholder: '- Deliverable 1: Description\n- Deliverable 2: Description\n- Deliverable 3: Description' },
      { name: 'milestones', label: 'Milestones & Timeline', type: 'textarea', placeholder: 'Phase 1 (Week 1-2): Discovery & Planning\nPhase 2 (Week 3-4): Design\nPhase 3 (Week 5-8): Development' },
      { name: 'currency', label: 'Currency', type: 'text', default: '$', placeholder: '$' },
      { name: 'total_fee', label: 'Total Fee', type: 'currency', placeholder: '15000' },
      { name: 'payment_schedule', label: 'Payment Schedule', type: 'textarea', default: '50% upon signing\n50% upon completion', placeholder: '' },
      { name: 'change_process', label: 'Change Request Process', type: 'textarea', default: 'Any changes to scope require written approval from both parties. Changes may affect timeline and compensation. The Contractor will provide a written estimate for any proposed changes before work begins.', placeholder: '' },
    ],
    sections: [
      { heading: 'Project Overview', body: 'Project: {{project}}\nClient: {{client_name}}\nContractor: {{contractor_name}}\nDate: {{date}}\n\n{{scope}}' },
      { heading: 'Deliverables', body: '{{deliverables}}' },
      { heading: 'Timeline', body: 'Start Date: {{date}}\nEstimated Completion: {{end_date}}\n\n{{milestones}}' },
      { heading: 'Compensation', body: 'Total Project Fee: {{currency}}{{total_fee}}\n\nPayment Schedule:\n{{payment_schedule}}' },
      { heading: 'Change Requests', body: '{{change_process}}' },
      { heading: 'Acceptance', body: 'Both parties agree to the terms outlined in this Statement of Work. Work shall commence upon signed acceptance.' },
    ],
  },

  nda: {
    name: 'Non-Disclosure Agreement (NDA)',
    category: 'protection',
    hasSignature: false,
    vars: [
      { name: 'disclosing_party', label: 'Disclosing Party', type: 'text', placeholder: 'Client Corp' },
      { name: 'receiving_party', label: 'Receiving Party', type: 'text', placeholder: 'Your Name' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'purpose', label: 'Purpose of Disclosure', type: 'textarea', placeholder: 'To evaluate a potential business relationship for web development services...' },
      { name: 'term', label: 'Term (years)', type: 'text', default: '3', placeholder: '3' },
      { name: 'governing_law', label: 'Governing Law', type: 'text', placeholder: 'State of California' },
    ],
    sections: [
      { heading: 'Parties', body: 'This Non-Disclosure Agreement ("Agreement") is entered into on {{date}} between {{disclosing_party}} ("Disclosing Party") and {{receiving_party}} ("Receiving Party").' },
      { heading: 'Purpose', body: 'The parties wish to explore a potential business relationship. In connection with this purpose, the Disclosing Party may share confidential information with the Receiving Party.\n\n{{purpose}}' },
      { heading: 'Definition of Confidential Information', body: '"Confidential Information" means any non-public information disclosed by the Disclosing Party, including but not limited to: business plans, financial data, customer lists, technical specifications, trade secrets, software, designs, and any other proprietary information, whether disclosed orally, in writing, or by any other means.' },
      { heading: 'Obligations', body: 'The Receiving Party agrees to:\n\n1. Hold all Confidential Information in strict confidence\n2. Not disclose Confidential Information to any third parties without prior written consent\n3. Use Confidential Information solely for the stated Purpose\n4. Take reasonable measures to protect the confidentiality of the information\n5. Limit access to Confidential Information to employees and contractors who have a need to know and are bound by confidentiality obligations at least as restrictive as those herein' },
      { heading: 'Exclusions', body: 'This Agreement does not apply to information that:\n\n1. Is or becomes publicly available through no fault of the Receiving Party\n2. Was known to the Receiving Party prior to disclosure\n3. Is independently developed by the Receiving Party without use of Confidential Information\n4. Is rightfully received from a third party without restriction\n5. Is required to be disclosed by law or court order, provided the Receiving Party gives prompt notice to the Disclosing Party' },
      { heading: 'Return of Information', body: 'Upon termination of this Agreement or upon request, the Receiving Party shall promptly return or destroy all Confidential Information and any copies thereof, and shall certify such destruction in writing.' },
      { heading: 'Term', body: 'This Agreement remains in effect for {{term}} years from the date of disclosure. The obligations of confidentiality shall survive termination of this Agreement.' },
      { heading: 'Remedies', body: 'The Receiving Party acknowledges that unauthorized disclosure of Confidential Information may cause irreparable harm for which monetary damages would be inadequate. The Disclosing Party shall be entitled to seek injunctive relief in addition to any other remedies available at law or in equity.' },
      { heading: 'Governing Law', body: 'This Agreement shall be governed by the laws of {{governing_law}}.' },
    ],
  },

  payment: {
    name: 'Invoice Payment Terms',
    category: 'payment',
    hasSignature: false,
    vars: [
      { name: 'invoice_number', label: 'Invoice Number', type: 'text', placeholder: 'INV-001' },
      { name: 'date', label: 'Invoice Date', type: 'date' },
      { name: 'due_date', label: 'Due Date', type: 'date' },
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'payment_days', label: 'Net Days', type: 'text', default: '30', placeholder: '30' },
      { name: 'late_fee', label: 'Late Fee (% per month)', type: 'text', default: '1.5', placeholder: '1.5' },
      { name: 'email', label: 'Contact Email', type: 'text', placeholder: 'billing@company.com' },
      { name: 'bank_name', label: 'Bank Name', type: 'text', placeholder: 'First National Bank' },
      { name: 'account_number', label: 'Account Number', type: 'text', placeholder: '****1234' },
      { name: 'routing_number', label: 'Routing Number', type: 'text', placeholder: '021000021' },
      { name: 'paypal_email', label: 'PayPal Email', type: 'text', placeholder: 'payments@company.com' },
    ],
    sections: [
      { heading: 'Invoice Details', body: 'Invoice Number: {{invoice_number}}\nDate: {{date}}\nDue Date: {{due_date}}\nClient: {{client_name}}' },
      { heading: 'Payment Terms', body: 'Payment is due within {{payment_days}} days of the invoice date (Net {{payment_days}}). All amounts are in the currency specified on the invoice.' },
      { heading: 'Late Payment', body: 'A late fee of {{late_fee}}% per month will be assessed on all balances not paid by the due date. The Client shall be responsible for all costs of collection, including reasonable attorney\'s fees.' },
      { heading: 'Payment Methods', body: 'Bank Transfer:\n  Bank: {{bank_name}}\n  Account: {{account_number}}\n  Routing: {{routing_number}}\n\nPayPal: {{paypal_email}}\n\nCheck: Please make payable to the name on the invoice and mail to the address provided.' },
      { heading: 'Disputes', body: 'Any disputes regarding the invoice must be raised in writing within 10 days of receipt. Undisputed portions remain due according to the original terms.' },
      { heading: 'Contact', body: 'For questions regarding this invoice, contact: {{email}}' },
    ],
  },

  signoff: {
    name: 'Project Sign-off',
    category: 'project',
    hasSignature: true,
    vars: [
      { name: 'project', label: 'Project Name', type: 'text', placeholder: 'Website Redesign' },
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'contractor_name', label: 'Contractor', type: 'text', placeholder: 'Your Name' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'sow_reference', label: 'SOW / Contract Reference', type: 'text', placeholder: 'SOW-2025-001' },
      { name: 'deliverable_1', label: 'Deliverable 1', type: 'text', placeholder: 'Responsive Website' },
      { name: 'deliverable_1_status', label: 'Deliverable 1 Accepted', type: 'toggle', default: 'on' },
      { name: 'deliverable_2', label: 'Deliverable 2', type: 'text', placeholder: 'Design System' },
      { name: 'deliverable_2_status', label: 'Deliverable 2 Accepted', type: 'toggle', default: 'on' },
      { name: 'deliverable_3', label: 'Deliverable 3', type: 'text', placeholder: 'CMS Integration' },
      { name: 'deliverable_3_status', label: 'Deliverable 3 Accepted', type: 'toggle' },
      { name: 'deliverable_4', label: 'Deliverable 4', type: 'text', placeholder: '' },
      { name: 'deliverable_4_status', label: 'Deliverable 4 Accepted', type: 'toggle' },
      { name: 'acceptance_notes', label: 'Acceptance Notes', type: 'textarea', placeholder: 'Any notes on acceptance, outstanding items, or conditions...' },
      { name: 'final_payment', label: 'Final Payment Amount', type: 'currency', placeholder: '5000' },
      { name: 'final_payment_due', label: 'Final Payment Due (days)', type: 'text', default: '15', placeholder: '15' },
      { name: 'warranty_days', label: 'Warranty Period (days)', type: 'text', default: '30', placeholder: '30' },
      { name: 'warranty_scope', label: 'Warranty Scope', type: 'textarea', default: 'Bug fixes for issues directly related to the delivered work. Does not cover new feature requests, changes in scope, or issues caused by third-party services or client modifications.', placeholder: '' },
    ],
    sections: [
      { heading: 'Project Information', body: 'Project: {{project}}\nClient: {{client_name}}\nContractor: {{contractor_name}}\nDate: {{date}}\nReference: {{sow_reference}}' },
      { heading: 'Deliverables Acceptance', body: 'The Client confirms acceptance of the following deliverables:\n\n{{#if deliverable_1_status}}✓ {{deliverable_1}}\n{{/if}}{{#if deliverable_2_status}}✓ {{deliverable_2}}\n{{/if}}{{#if deliverable_3_status}}✓ {{deliverable_3}}\n{{/if}}{{#if deliverable_4_status}}✓ {{deliverable_4}}\n{{/if}}' },
      { heading: 'Acceptance Notes', body: '{{acceptance_notes}}' },
      { heading: 'Final Payment', body: 'A final payment of {{currency}}{{final_payment}} is due within {{final_payment_due}} days of this sign-off. Failure to remit payment within this period may result in late fees as outlined in the original agreement.' },
      { heading: 'Warranty', body: 'The Contractor provides a warranty period of {{warranty_days}} days from the date of this sign-off.\n\n{{warranty_scope}}' },
      { heading: 'Signatures', body: 'By signing below, both parties agree that the project has been completed and accepted per the terms of the original agreement.' },
    ],
  },

  msa: {
    name: 'Master Services Agreement',
    category: 'agreements',
    hasSignature: true,
    vars: [
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'client_address', label: 'Client Address', type: 'text', placeholder: '123 Main St, City, State' },
      { name: 'contractor_name', label: 'Contractor', type: 'text', placeholder: 'Your Name / Company' },
      { name: 'contractor_address', label: 'Contractor Address', type: 'text', placeholder: '456 Oak Ave, City, State' },
      { name: 'date', label: 'Effective Date', type: 'date' },
      { name: 'services', label: 'Description of Services', type: 'textarea', placeholder: 'Web development, design, consulting, and related technical services as described in individual Statements of Work...' },
      { name: 'rate', label: 'Standard Rate', type: 'currency', placeholder: '150' },
      { name: 'period', label: 'Rate Period', type: 'text', default: 'hour', placeholder: 'hour' },
      { name: 'payment_days', label: 'Payment Terms (days)', type: 'text', default: '30', placeholder: '30' },
      { name: 'late_fee', label: 'Late Fee (% per month)', type: 'text', default: '1.5', placeholder: '1.5' },
      { name: 'liability_cap', label: 'Liability Cap (months of fees)', type: 'text', default: '12', placeholder: '12' },
      { name: 'notice_days', label: 'Termination Notice (days)', type: 'text', default: '30', placeholder: '30' },
      { name: 'cure_days', label: 'Cure Period (days)', type: 'text', default: '15', placeholder: '15' },
      { name: 'governing_law', label: 'Governing Law', type: 'text', placeholder: 'State of California' },
      { name: 'arbitration_location', label: 'Arbitration Location', type: 'text', placeholder: 'San Francisco, CA' },
    ],
    sections: [
      { heading: 'Parties', body: 'This Master Services Agreement ("Agreement") is entered into as of {{date}} between:\n\n{{client_name}}, with principal offices at {{client_address}} ("Client")\n\nand\n\n{{contractor_name}}, with principal offices at {{contractor_address}} ("Contractor").' },
      { heading: '1. Services', body: '1.1 The Contractor agrees to provide the following services to the Client: {{services}}\n\n1.2 Specific projects shall be governed by individual Statements of Work ("SOW") executed under this Agreement. Each SOW shall describe the scope, timeline, deliverables, and fees for that project.\n\n1.3 In the event of a conflict between this Agreement and any SOW, the SOW shall control with respect to that specific project.' },
      { heading: '2. Compensation', body: '2.1 The Client shall pay the Contractor at a rate of {{currency}}{{rate}} per {{period}}, unless otherwise specified in an applicable SOW.\n\n2.2 Invoices shall be submitted monthly and are due within {{payment_days}} days of receipt (Net {{payment_days}}).\n\n2.3 A late fee of {{late_fee}}% per month shall be assessed on overdue balances.\n\n2.4 The Client shall reimburse the Contractor for reasonable pre-approved expenses incurred in the performance of services.' },
      { heading: '3. Intellectual Property', body: '3.1 All work product created by the Contractor under this Agreement shall be considered "work made for hire" as defined by the U.S. Copyright Act.\n\n3.2 To the extent any work product does not qualify as work made for hire, the Contractor hereby irrevocably assigns to the Client all right, title, and interest in and to such work product, including all intellectual property rights.\n\n3.3 The Contractor retains the right to use general knowledge, skills, techniques, and know-how acquired during the performance of services, provided such use does not disclose or infringe upon the Client\'s Confidential Information or intellectual property.\n\n3.4 The Contractor retains ownership of pre-existing intellectual property ("Background IP") used in the performance of services. The Contractor grants the Client a non-exclusive, perpetual, royalty-free license to use any Background IP incorporated into deliverables.' },
      { heading: '4. Confidentiality', body: '4.1 Each party agrees to maintain the confidentiality of all proprietary and confidential information disclosed by the other party during the term of this Agreement.\n\n4.2 "Confidential Information" includes, but is not limited to: business plans, financial data, customer lists, technical specifications, trade secrets, source code, designs, and any other information marked or reasonably understood to be confidential.\n\n4.3 The obligations of confidentiality shall not apply to information that: (a) is publicly available; (b) was known prior to disclosure; (c) is independently developed; (d) is rightfully received from a third party; or (e) is required by law to be disclosed.\n\n4.4 These obligations survive termination of this Agreement for a period of 3 years.' },
      { heading: '5. Representations and Warranties', body: '5.1 The Contractor represents that: (a) it has the right to enter this Agreement; (b) services will be performed in a professional and workmanlike manner; (c) deliverables will conform to the specifications in the applicable SOW; and (d) the work will not infringe upon any third-party intellectual property rights.\n\n5.2 EXCEPT AS EXPRESSLY SET FORTH HEREIN, THE CONTRACTOR MAKES NO OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.' },
      { heading: '6. Indemnification', body: '6.1 The Contractor shall indemnify, defend, and hold harmless the Client from any third-party claims that the deliverables infringe upon intellectual property rights.\n\n6.2 The Client shall indemnify, defend, and hold harmless the Contractor from any claims arising from: (a) the Client\'s use of deliverables not in accordance with the Contractor\'s specifications; (b) modifications to deliverables by the Client or third parties; or (c) the Client\'s breach of this Agreement.' },
      { heading: '7. Limitation of Liability', body: '7.1 IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.\n\n7.2 THE CONTRACTOR\'S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE TOTAL FEES PAID OR PAYABLE TO THE CONTRACTOR IN THE {{liability_cap}} MONTHS PRECEDING THE CLAIM.\n\n7.3 This limitation shall not apply to: (a) breaches of confidentiality; (b) indemnification obligations; or (c) willful misconduct or gross negligence.' },
      { heading: '8. Term and Termination', body: '8.1 This Agreement shall commence on {{date}} and continue until terminated by either party.\n\n8.2 Either party may terminate this Agreement for convenience with {{notice_days}} days written notice.\n\n8.3 Either party may terminate this Agreement for cause if the other party materially breaches this Agreement and fails to cure such breach within {{cure_days}} days of written notice.\n\n8.4 Upon termination: (a) the Client shall pay for all services performed through the termination date; (b) the Contractor shall deliver all completed and in-progress work; and (c) each party shall return or destroy the other party\'s Confidential Information.' },
      { heading: '9. Non-Solicitation', body: '9.1 During the term of this Agreement and for 12 months thereafter, neither party shall directly solicit or hire any employee or contractor of the other party who was involved in the performance of this Agreement, without prior written consent.' },
      { heading: '10. Dispute Resolution', body: '10.1 The parties shall first attempt to resolve any dispute through good faith negotiation.\n\n10.2 If negotiation fails, disputes shall be resolved through binding arbitration in {{arbitration_location}} in accordance with the rules of the American Arbitration Association.\n\n10.3 The prevailing party in any dispute shall be entitled to recover reasonable attorney\'s fees and costs.' },
      { heading: '11. General Provisions', body: '11.1 This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements.\n\n11.2 This Agreement may only be amended in writing signed by both parties.\n\n11.3 Neither party may assign this Agreement without the other party\'s written consent, except in connection with a merger, acquisition, or sale of substantially all assets.\n\n11.4 If any provision is found unenforceable, the remaining provisions shall continue in full force.\n\n11.5 This Agreement shall be governed by the laws of {{governing_law}}.' },
    ],
  },

  sla: {
    name: 'Service Level Agreement',
    category: 'protection',
    hasSignature: false,
    vars: [
      { name: 'provider_name', label: 'Service Provider', type: 'text', placeholder: 'Your Company' },
      { name: 'client_name', label: 'Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'date', label: 'Effective Date', type: 'date' },
      { name: 'service_description', label: 'Service Description', type: 'textarea', placeholder: 'Website hosting, maintenance, and technical support...' },
      { name: 'uptime_guarantee', label: 'Uptime Guarantee (%)', type: 'text', default: '99.9', placeholder: '99.9' },
      { name: 'response_critical', label: 'Critical Issue Response (hours)', type: 'text', default: '1', placeholder: '1' },
      { name: 'response_high', label: 'High Priority Response (hours)', type: 'text', default: '4', placeholder: '4' },
      { name: 'response_normal', label: 'Normal Response (hours)', type: 'text', default: '8', placeholder: '8' },
      { name: 'response_low', label: 'Low Priority Response (hours)', type: 'text', default: '24', placeholder: '24' },
      { name: 'resolution_critical', label: 'Critical Issue Resolution (hours)', type: 'text', default: '4', placeholder: '4' },
      { name: 'resolution_high', label: 'High Priority Resolution (hours)', type: 'text', default: '24', placeholder: '24' },
      { name: 'resolution_normal', label: 'Normal Resolution (hours)', type: 'text', default: '72', placeholder: '72' },
      { name: 'support_hours', label: 'Support Hours', type: 'text', default: 'Monday-Friday 9AM-6PM EST', placeholder: '' },
      { name: 'support_channel', label: 'Support Channel', type: 'text', placeholder: 'support@company.com, Slack #support' },
      { name: 'credit_1', label: 'Credit for 95-99% uptime (%)', type: 'text', default: '10', placeholder: '10' },
      { name: 'credit_2', label: 'Credit for below 95% uptime (%)', type: 'text', default: '25', placeholder: '25' },
      { name: 'review_frequency', label: 'Review Frequency', type: 'text', default: 'Monthly', placeholder: 'Monthly / Quarterly' },
    ],
    sections: [
      { heading: 'Parties', body: 'This Service Level Agreement ("SLA") is entered into as of {{date}} between {{provider_name}} ("Provider") and {{client_name}} ("Client").' },
      { heading: 'Service Description', body: '{{service_description}}' },
      { heading: 'Service Levels', body: 'Uptime Guarantee: {{uptime_guarantee}}%\n\nMeasurement: Uptime is measured monthly as the percentage of time the service is available and operational, excluding scheduled maintenance windows.\n\nScheduled Maintenance: The Provider shall provide at least 48 hours notice for planned maintenance. Maintenance windows shall not exceed 4 hours per month.' },
      { heading: 'Response & Resolution Times', body: 'The Provider shall respond to and resolve issues according to the following priority levels:\n\nCritical (Service Down):\n  Response: {{response_critical}} hours\n  Resolution: {{resolution_critical}} hours\n\nHigh (Major Feature Impacted):\n  Response: {{response_high}} hours\n  Resolution: {{resolution_high}} hours\n\nNormal (Minor Issue):\n  Response: {{response_normal}} hours\n  Resolution: {{resolution_normal}} hours\n\nLow (Question / Enhancement):\n  Response: {{response_low}} hours\n  Resolution: As scheduled' },
      { heading: 'Support', body: 'Support Hours: {{support_hours}}\n\nContact: {{support_channel}}\n\nAll support requests must be submitted through the designated channel. The Provider shall assign a priority level to each request based on impact and urgency.' },
      { heading: 'Exclusions', body: 'This SLA does not apply to:\n\n1. Issues caused by Client modifications or third-party services\n2. Scheduled maintenance windows\n3. Force majeure events\n4. Issues resulting from Client\'s failure to follow documented procedures\n5. Features in beta or development stage\n6. DNS propagation delays' },
      { heading: 'Service Credits', body: 'If the Provider fails to meet the uptime guarantee, the Client shall be entitled to service credits:\n\n{{credit_1}}% credit for uptime between 95% and {{uptime_guarantee}}%\n{{credit_2}}% credit for uptime below 95%\n\nCredits shall be applied to the next invoice. Total credits shall not exceed 50% of the monthly service fee. Credits are the Client\'s sole remedy for SLA violations.' },
      { heading: 'Reporting', body: 'The Provider shall deliver a service level report to the Client on a {{review_frequency}} basis. The report shall include:\n\n- Uptime percentage\n- Number and severity of incidents\n- Response and resolution times\n- Any planned maintenance activities' },
      { heading: 'Review & Amendments', body: 'This SLA shall be reviewed {{review_frequency}}. Either party may request amendments with 30 days written notice. Changes shall be documented in writing and signed by both parties.' },
    ],
  },

  subcontractor: {
    name: 'Subcontractor Agreement',
    category: 'agreements',
    hasSignature: true,
    vars: [
      { name: 'contractor_name', label: 'Primary Contractor', type: 'text', placeholder: 'Your Name / Company' },
      { name: 'sub_name', label: 'Subcontractor', type: 'text', placeholder: 'Subcontractor Name' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'project', label: 'Project', type: 'text', placeholder: 'Client Corp Website Redesign' },
      { name: 'scope', label: 'Scope of Work', type: 'textarea', placeholder: 'Description of work to be performed by the subcontractor...' },
      { name: 'deliverables', label: 'Deliverables', type: 'textarea', placeholder: '- Frontend development\n- Responsive implementation\n- Cross-browser testing' },
      { name: 'start_date', label: 'Start Date', type: 'date' },
      { name: 'end_date', label: 'End Date', type: 'date' },
      { name: 'rate', label: 'Rate', type: 'currency', placeholder: '100' },
      { name: 'period', label: 'Rate Period', type: 'text', default: 'hour', placeholder: 'hour / project' },
      { name: 'payment_days', label: 'Payment Terms (days)', type: 'text', default: '15', placeholder: '15' },
      { name: 'payment_schedule', label: 'Payment Schedule', type: 'textarea', default: 'Net {{payment_days}} days from invoice submission', placeholder: '' },
      { name: 'client_name', label: 'End Client', type: 'text', placeholder: 'Client Corp' },
      { name: 'non_solicit_months', label: 'Non-Solicitation (months)', type: 'text', default: '12', placeholder: '12' },
      { name: 'notice_days', label: 'Termination Notice (days)', type: 'text', default: '14', placeholder: '14' },
    ],
    sections: [
      { heading: 'Parties', body: 'This Subcontractor Agreement ("Agreement") is entered into as of {{date}} between {{contractor_name}} ("Contractor") and {{sub_name}} ("Subcontractor").' },
      { heading: 'Engagement', body: 'The Contractor engages the Subcontractor to perform services related to the {{project}} project for the benefit of {{client_name}} ("Client").\n\nThe Subcontractor is an independent contractor, not an employee or agent of the Contractor. The Subcontractor is responsible for their own taxes, insurance, and benefits.' },
      { heading: 'Scope of Work', body: '{{scope}}\n\nDeliverables:\n{{deliverables}}' },
      { heading: 'Timeline', body: 'Start Date: {{start_date}}\nEnd Date: {{end_date}}\n\nThe Subcontractor shall complete all work within the specified timeline. Any delays must be communicated promptly to the Contractor.' },
      { heading: 'Compensation', body: 'Rate: {{currency}}{{rate}} per {{period}}\n\nPayment Terms: {{payment_schedule}}\n\nThe Subcontractor shall submit invoices with detailed time records or deliverable milestones. The Contractor shall process payment within {{payment_days}} days of invoice approval.' },
      { heading: 'Independent Contractor', body: 'The Subcontractor acknowledges that:\n\n1. They are not entitled to any employee benefits from the Contractor\n2. They are solely responsible for all taxes on compensation received\n3. They control the manner and means of performing the work\n4. They may engage other subcontractors with prior written approval of the Contractor\n5. They are not authorized to bind the Contractor or the Client' },
      { heading: 'Intellectual Property', body: 'All work product created by the Subcontractor under this Agreement shall be assigned to the Contractor upon full payment. The Subcontractor hereby assigns all rights, title, and interest in such work product to the Contractor.\n\nThe Subcontractor retains ownership of pre-existing tools, libraries, and frameworks used in the performance of services, and grants the Contractor a non-exclusive license to use such materials as incorporated into deliverables.' },
      { heading: 'Confidentiality', body: 'The Subcontractor agrees to maintain strict confidentiality of all information related to the Contractor, the Client, and the project. This includes but is not limited to: project details, client information, business strategies, technical specifications, and source code.\n\nThe Subcontractor shall not disclose any confidential information to third parties without prior written consent. This obligation survives termination of this Agreement.' },
      { heading: 'Client Relationship', body: 'The Subcontractor shall not directly contact or communicate with the Client without the Contractor\'s prior written approval. All communications with the Client shall be channeled through the Contractor.\n\nThe Subcontractor shall not represent themselves as an employee or agent of the Contractor or the Client.' },
      { heading: 'Non-Solicitation', body: 'For {{non_solicit_months}} months after termination of this Agreement, the Subcontractor shall not:\n\n1. Directly solicit or accept work from the Client\n2. Solicit or hire any employee or contractor of the Contractor\n3. Induce any employee or contractor of the Contractor to leave their engagement' },
      { heading: 'Termination', body: 'Either party may terminate this Agreement with {{notice_days}} days written notice.\n\nThe Contractor may terminate this Agreement immediately for cause, including but not limited to: material breach, failure to meet deliverables, or conduct that damages the Contractor\'s reputation.\n\nUpon termination, the Subcontractor shall deliver all completed and in-progress work and return all confidential materials.' },
      { heading: 'Flow-Down Clauses', body: 'The Subcontractor agrees to comply with all applicable terms from the Contractor\'s agreement with the Client, including but not limited to: confidentiality requirements, IP assignment, and security standards. The Contractor shall provide relevant terms upon request.' },
      { heading: 'Limitation of Liability', body: 'The Subcontractor\'s total liability under this Agreement shall not exceed the total fees paid under this Agreement. In no event shall either party be liable for indirect, incidental, or consequential damages.' },
      { heading: 'Governing Law', body: 'This Agreement shall be governed by the laws of the jurisdiction where the Contractor operates.' },
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

const SIGNATURE_TABS_HTML = `
  <div class="pdf-sign-tabs">
    <button class="btn btn--ghost btn--sm fcct-sig-tab active" data-mode="draw">Draw</button>
    <button class="btn btn--ghost btn--sm fcct-sig-tab" data-mode="type">Type</button>
    <button class="btn btn--ghost btn--sm fcct-sig-tab" data-mode="upload">Upload</button>
  </div>
  <div class="fcct-sig-draw-panel">
    <canvas class="fcct-sig-canvas" width="300" height="80"></canvas>
    <button class="btn btn--ghost btn--sm fcct-sig-clear">Clear</button>
  </div>
  <div class="fcct-sig-type-panel" style="display:none;">
    <select class="input fcct-sig-font">
      <option value="'Dancing Script', cursive">Dancing Script</option>
      <option value="'Great Vibes', cursive">Great Vibes</option>
      <option value="'Pacifico', cursive">Pacifico</option>
      <option value="cursive">Default Cursive</option>
    </select>
    <input type="text" class="input fcct-sig-type-input" placeholder="Type your name">
    <button class="btn btn--ghost btn--sm fcct-sig-type-apply">Apply</button>
  </div>
  <div class="fcct-sig-upload-panel" style="display:none;">
    <input type="file" class="fcct-sig-upload" accept="image/*">
  </div>
  <button class="btn btn--ghost btn--sm fcct-sig-clear-sig">Remove Signature</button>
`;

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
  private sigSection!: HTMLDivElement;
  private currentVars: Record<string, string> = {};
  private currencySymbol = '$';
  private sigDataUrl: string | null = null;
  private clientSigDataUrl: string | null = null;
  private logoDataUrl: string | null = null;
  private watermarkText = '';
  private logoSize = 48;
  private sigSize = 160;
  private sigDrawCtx!: CanvasRenderingContext2D;
  private clientSigDrawCtx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private root!: HTMLElement;
  // Signature overlay positions (percentage of page dimensions)
  private contractorSigPos = { x: 0.55, y: 0.78, w: 150, h: 60 };
  private clientSigPos = { x: 0.55, y: 0.78, w: 150, h: 60 };

  render(): string {
    const grouped: Record<string, [string, TemplateDef][]> = {};
    for (const [k, v] of Object.entries(TEMPLATES)) {
      (grouped[v.category] ??= []).push([k, v]);
    }

    const opts = Object.entries(CATEGORY_LABELS)
      .filter(([k]) => grouped[k])
      .map(([cat, label]) =>
        `<optgroup label="${label}">${grouped[cat].map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</optgroup>`
      ).join('');

    return `
      <div class="fcct-layout">
        <div class="fcct-form">
          <div class="fcct-branding">
            <div class="form-group">
              <label class="label">Logo</label>
              <div class="fcct-logo-row">
                <input type="file" accept="image/*" id="fcct-logo-input" hidden>
                <button class="btn btn--ghost btn--sm" id="fcct-logo-btn">Upload Logo</button>
                <img id="fcct-logo-preview" class="fcct-logo-thumb" style="display:none;">
                <button class="btn btn--ghost btn--sm" id="fcct-logo-remove" style="display:none;">×</button>
              </div>
              <div class="fcct-size-row" id="fcct-logo-size-row" style="display:none;">
                <input type="range" min="24" max="96" value="48" class="fcct-size-slider" id="fcct-logo-size">
                <span class="fcct-size-val" id="fcct-logo-size-val">48px</span>
              </div>
            </div>
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
          <div class="fcct-sig-section" id="fcct-sig-section" style="display:none;">
            <div class="fcct-sig-block">
              <label class="label">Contractor Signature</label>
              ${SIGNATURE_TABS_HTML}
            </div>
            <div class="fcct-sig-block fcct-client-sig-block">
              <label class="label">Client Signature</label>
              ${SIGNATURE_TABS_HTML}
            </div>
            <div class="fcct-size-row fcct-sig-size-row">
              <label class="label">Signature Size</label>
              <input type="range" min="80" max="300" value="160" class="fcct-size-slider" id="fcct-sig-size">
              <span class="fcct-size-val" id="fcct-sig-size-val">160px</span>
            </div>
          </div>
          <div class="tool-actions fcct-export-actions">
            <button class="btn btn--primary" id="fcct-copy">Copy Formatted</button>
            <button class="btn btn--ghost" id="fcct-export-pdf">Export PDF</button>
            <button class="btn btn--ghost" id="fcct-export-docx">Export DOCX</button>
          </div>
        </div>
        <div class="fcct-preview-col">
          <div class="fcct-preview-header">
            <button class="btn btn--ghost btn--sm" id="fcct-fullscreen">Full Screen</button>
          </div>
          <div class="fcct-paper">
            <div class="fcct-paper__inner" id="fcct-preview"></div>
            <div class="fcct-sig-overlay" id="fcct-contractor-overlay">
              <img class="fcct-sig-overlay__img" id="fcct-contractor-overlay-img">
              <div class="fcct-sig-handle fcct-sig-handle--nw" data-handle="nw"></div>
              <div class="fcct-sig-handle fcct-sig-handle--ne" data-handle="ne"></div>
              <div class="fcct-sig-handle fcct-sig-handle--sw" data-handle="sw"></div>
              <div class="fcct-sig-handle fcct-sig-handle--se" data-handle="se"></div>
            </div>
            <div class="fcct-sig-overlay" id="fcct-client-overlay">
              <img class="fcct-sig-overlay__img" id="fcct-client-overlay-img">
              <div class="fcct-sig-handle fcct-sig-handle--nw" data-handle="nw"></div>
              <div class="fcct-sig-handle fcct-sig-handle--ne" data-handle="ne"></div>
              <div class="fcct-sig-handle fcct-sig-handle--sw" data-handle="sw"></div>
              <div class="fcct-sig-handle fcct-sig-handle--se" data-handle="se"></div>
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
    this.sigSection = root.querySelector('#fcct-sig-section')!;

    const defaultCurrency = await db.getPreference('defaultCurrency', 'USD') as string;
    this.currencySymbol = getCurrencySymbol(defaultCurrency || 'USD');
    this.currentVars['currency'] = this.currencySymbol;

    this.templateSelect.addEventListener('change', () => {
      this.currentVars = { currency: this.currencySymbol };
      this.sigDataUrl = null;
      this.clientSigDataUrl = null;
      this.renderVars();
      this.updatePreview();
      this.updateSigVisibility();
    });

    root.querySelector('#fcct-copy')!.addEventListener('click', () => this.copyFormatted());
    root.querySelector('#fcct-export-pdf')!.addEventListener('click', () => this.exportPDF());
    root.querySelector('#fcct-export-docx')!.addEventListener('click', () => this.exportDOCX());

    // Logo upload
    const logoInput = root.querySelector('#fcct-logo-input') as HTMLInputElement;
    const logoBtn = root.querySelector('#fcct-logo-btn')!;
    const logoPreview = root.querySelector('#fcct-logo-preview') as HTMLImageElement;
    const logoRemove = root.querySelector('#fcct-logo-remove') as HTMLElement;
    logoBtn.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', () => {
      const file = logoInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoDataUrl = reader.result as string;
        logoPreview.src = this.logoDataUrl;
        logoPreview.style.display = '';
        logoRemove.style.display = '';
        (root.querySelector('#fcct-logo-size-row') as HTMLElement).style.display = '';
        this.updatePreview();
      };
      reader.readAsDataURL(file);
    });
    logoRemove.addEventListener('click', () => {
      this.logoDataUrl = null;
      logoInput.value = '';
      logoPreview.style.display = 'none';
      logoRemove.style.display = 'none';
      (root.querySelector('#fcct-logo-size-row') as HTMLElement).style.display = 'none';
      this.updatePreview();
    });

    // Size sliders
    const logoSizeSlider = root.querySelector('#fcct-logo-size') as HTMLInputElement;
    const logoSizeVal = root.querySelector('#fcct-logo-size-val')!;
    logoSizeSlider.addEventListener('input', () => {
      this.logoSize = parseInt(logoSizeSlider.value);
      logoSizeVal.textContent = this.logoSize + 'px';
      this.updatePreview();
    });

    const sigSizeSlider = root.querySelector('#fcct-sig-size') as HTMLInputElement;
    const sigSizeVal = root.querySelector('#fcct-sig-size-val')!;
    sigSizeSlider.addEventListener('input', () => {
      this.sigSize = parseInt(sigSizeSlider.value);
      sigSizeVal.textContent = this.sigSize + 'px';
      this.updatePreview();
    });

    // Watermark
    const watermarkInput = root.querySelector('#fcct-watermark') as HTMLInputElement;
    watermarkInput.addEventListener('input', () => {
      this.watermarkText = watermarkInput.value;
      this.updatePreview();
    });

    // Full screen preview
    root.querySelector('#fcct-fullscreen')?.addEventListener('click', () => this.openFullScreenPreview());

    this.initSignaturePad(root, '.fcct-sig-block:not(.fcct-client-sig-block)', (url) => { this.sigDataUrl = url; });
    this.initSignaturePad(root, '.fcct-client-sig-block', (url) => { this.clientSigDataUrl = url; });

    // Initialize signature overlay drag/resize
    this.initOverlayDrag(root, '#fcct-contractor-overlay', this.contractorSigPos);
    this.initOverlayDrag(root, '#fcct-client-overlay', this.clientSigPos);

    this.renderVars();
    this.updatePreview();
    this.updateSigVisibility();
    wireSharedInputs(root);
  }

  private initSignaturePad(root: HTMLElement, blockSelector: string, onSig: (url: string) => void): void {
    const block = root.querySelector(blockSelector)!;
    const canvas = block.querySelector('.fcct-sig-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    let drawing = false;
    canvas.addEventListener('pointerdown', (e) => { drawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
    canvas.addEventListener('pointermove', (e) => { if (!drawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); });
    canvas.addEventListener('pointerup', () => { drawing = false; onSig(canvas.toDataURL('image/png')); });
    canvas.addEventListener('pointerleave', () => { drawing = false; });

    block.querySelector('.fcct-sig-clear')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSig('');
    });

    block.querySelectorAll('.fcct-sig-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        block.querySelectorAll('.fcct-sig-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = (tab as HTMLElement).dataset.mode;
        (block.querySelector('.fcct-sig-draw-panel') as HTMLElement).style.display = mode === 'draw' ? '' : 'none';
        (block.querySelector('.fcct-sig-type-panel') as HTMLElement).style.display = mode === 'type' ? '' : 'none';
        (block.querySelector('.fcct-sig-upload-panel') as HTMLElement).style.display = mode === 'upload' ? '' : 'none';
      });
    });

    const typeInput = block.querySelector('.fcct-sig-type-input') as HTMLInputElement;
    const fontSelect = block.querySelector('.fcct-sig-font') as HTMLSelectElement;
    const typeApply = block.querySelector('.fcct-sig-type-apply')!;
    const renderType = () => {
      const text = typeInput.value.trim();
      if (!text) return;
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = 300; tmpCanvas.height = 80;
      const tmpCtx = tmpCanvas.getContext('2d')!;
      tmpCtx.fillStyle = '#000';
      tmpCtx.font = `36px ${fontSelect.value}`;
      tmpCtx.textBaseline = 'middle';
      tmpCtx.fillText(text, 10, 40);
      onSig(tmpCanvas.toDataURL('image/png'));
    };
    typeApply.addEventListener('click', renderType);
    typeInput.addEventListener('input', renderType);

    const uploadInput = block.querySelector('.fcct-sig-upload') as HTMLInputElement;
    uploadInput.addEventListener('change', () => {
      const file = uploadInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onSig(reader.result as string);
      reader.readAsDataURL(file);
    });

    block.querySelector('.fcct-sig-clear-sig')?.addEventListener('click', () => {
      onSig('');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Load default signature for contractor only
    if (!blockSelector.includes('client')) {
      db.getPreference('defaultSignature', null).then(sig => {
        if (sig) onSig(sig as string);
      });
    }
  }

  private updateSigVisibility(): void {
    const def = TEMPLATES[this.templateSelect.value];
    this.sigSection.style.display = def.hasSignature ? '' : 'none';
  }

  private renderVars(): void {
    const def = TEMPLATES[this.templateSelect.value];
    this.varsContainer.innerHTML = def.vars.map(v => renderVarInput(v, this.currencySymbol)).join('');

    this.varsContainer.querySelectorAll('.fcct-input').forEach(el => {
      const input = el as HTMLInputElement;
      const varName = input.dataset.var!;
      const varType = input.dataset.type;
      const handler = () => {
        if (varType === 'toggle') {
          this.currentVars[varName] = (input as HTMLInputElement).checked ? 'on' : '';
        } else {
          this.currentVars[varName] = input.value;
        }
        this.updatePreview();
      };
      input.addEventListener(varType === 'toggle' ? 'change' : 'input', handler);
    });
  }

  private updatePreview(): void {
    const def = TEMPLATES[this.templateSelect.value];
    const docTitle = def.name.toUpperCase();

    const dateVal = this.currentVars['date'] || '';
    const formattedDate = dateVal ? new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const clientName = this.currentVars['client_name'] || this.currentVars['disclosing_party'] || '';
    const parties = clientName ? `Prepared for: ${clientName}` : '';

    const logoHtml = this.logoDataUrl
      ? `<img src="${this.logoDataUrl}" class="fcct-paper__logo" style="max-height:${this.logoSize}px">`
      : '';

    const headerBlock = `
      <div class="fcct-paper__header">
        ${logoHtml}
        <div class="fcct-paper__header-text">
          <h1>${docTitle}</h1>
          ${formattedDate ? `<p class="fcct-paper__date">${formattedDate}</p>` : ''}
          ${parties ? `<p class="fcct-paper__parties">${parties}</p>` : ''}
        </div>
      </div>`;

    // ponytail: approximate A4 content height at 96dpi with 20mm margins
    const PAGE_HEIGHT = 1000;
    let cumHeight = 0;
    let pageNum = 1;
    const sectionsHtml = def.sections.map(s => {
      let body = s.body;
      body = this.processConditionals(body);
      body = this.substituteVars(body);
      body = this.formatBody(body);
      const sectionHtml = `<div class="fcct-section"><h2>${s.heading}</h2>${body}</div>`;
      // rough estimate: ~20px per heading + ~16px per paragraph line
      const estHeight = 40 + (body.split('\n').length * 18);
      cumHeight += estHeight;
      if (cumHeight > PAGE_HEIGHT) {
        pageNum++;
        cumHeight = estHeight;
        return `<div class="fcct-page-break">— Page ${pageNum} —</div>${sectionHtml}`;
      }
      return sectionHtml;
    }).join('');

    // Split content into pages at page break markers
    const allContent = headerBlock + sectionsHtml;
    const pageBreakRegex = /<div class="fcct-page-break">[^<]*<\/div>/;
    const chunks = allContent.split(pageBreakRegex);

    const watermarkOverlay = this.watermarkText
      ? `<div class="fcct-watermark"><span class="fcct-watermark-text">${this.watermarkText}</span></div>`
      : '';

    const pagesHtml = chunks.map((chunk, i) =>
      `<div class="fcct-page">${watermarkOverlay}<div class="fcct-page__inner">${chunk}</div></div>`
    ).join('');

    this.previewEl.innerHTML = pagesHtml;

    // Scale pages to fit container
    const paperEl = this.previewEl.closest('.fcct-paper') as HTMLElement;
    if (paperEl) {
      const containerWidth = paperEl.clientWidth - 64; // minus padding
      const pageWidthPx = 794; // 210mm in px
      const scale = Math.min(1, Math.max(0.65, containerWidth / pageWidthPx));

      this.previewEl.querySelectorAll('.fcct-page').forEach(page => {
        const el = page as HTMLElement;
        el.style.transform = `scale(${scale})`;
        el.style.transformOrigin = 'top center';
        const actualHeight = el.offsetHeight;
        const marginBottom = -(actualHeight * (1 - scale));
        el.style.marginBottom = `${marginBottom}px`;
      });
    }

    // Position signature overlays on last page
    this.positionOverlays();
  }

  private positionOverlays(): void {
    const def = TEMPLATES[this.templateSelect.value];
    if (!def.hasSignature) return;

    const lastPage = this.previewEl.querySelector('.fcct-page:last-of-type') as HTMLElement;
    if (!lastPage) return;

    const pageRect = lastPage.getBoundingClientRect();

    // Position contractor overlay
    const contractorOverlay = this.root.querySelector('#fcct-contractor-overlay') as HTMLElement;
    const contractorImg = this.root.querySelector('#fcct-contractor-overlay-img') as HTMLImageElement;
    if (contractorOverlay) {
      if (this.sigDataUrl) {
        contractorImg.src = this.sigDataUrl;
        contractorOverlay.style.display = 'flex';
        contractorOverlay.style.left = (this.contractorSigPos.x * pageRect.width) + 'px';
        contractorOverlay.style.top = (this.contractorSigPos.y * pageRect.height) + 'px';
        contractorOverlay.style.width = this.contractorSigPos.w + 'px';
        contractorOverlay.style.height = this.contractorSigPos.h + 'px';
      } else {
        contractorOverlay.style.display = 'none';
      }
    }

    // Position client overlay
    const clientOverlay = this.root.querySelector('#fcct-client-overlay') as HTMLElement;
    const clientImg = this.root.querySelector('#fcct-client-overlay-img') as HTMLImageElement;
    if (clientOverlay) {
      if (this.clientSigDataUrl) {
        clientImg.src = this.clientSigDataUrl;
        clientOverlay.style.display = 'flex';
        clientOverlay.style.left = (this.clientSigPos.x * pageRect.width) + 'px';
        clientOverlay.style.top = (this.clientSigPos.y * pageRect.height) + 'px';
        clientOverlay.style.width = this.clientSigPos.w + 'px';
        clientOverlay.style.height = this.clientSigPos.h + 'px';
      } else {
        clientOverlay.style.display = 'none';
      }
    }
  }

  private initOverlayDrag(root: HTMLElement, overlaySelector: string, posState: { x: number; y: number; w: number; h: number }): void {
    const overlay = root.querySelector(overlaySelector) as HTMLElement;
    if (!overlay) return;

    const lastPage = this.previewEl.querySelector('.fcct-page:last-of-type') as HTMLElement;
    if (!lastPage) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    const clampToPage = (left: number, top: number, w: number, h: number) => {
      const pageRect = lastPage.getBoundingClientRect();
      const maxLeft = pageRect.width - w;
      const maxTop = pageRect.height - h;
      return {
        left: Math.max(0, Math.min(left, maxLeft)),
        top: Math.max(0, Math.min(top, maxTop)),
      };
    };

    overlay.addEventListener('pointerdown', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('fcct-sig-handle')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origLeft = overlay.offsetLeft;
      origTop = overlay.offsetTop;
      overlay.setPointerCapture(e.pointerId);
    });

    overlay.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const clamped = clampToPage(origLeft + dx, origTop + dy, posState.w, posState.h);
      overlay.style.left = clamped.left + 'px';
      overlay.style.top = clamped.top + 'px';
    });

    overlay.addEventListener('pointerup', () => {
      isDragging = false;
      // Save position as percentage
      const pageRect = lastPage.getBoundingClientRect();
      posState.x = overlay.offsetLeft / pageRect.width;
      posState.y = overlay.offsetTop / pageRect.height;
    });

    // Resize handles
    const handles = overlay.querySelectorAll('.fcct-sig-handle');
    handles.forEach(handle => {
      handle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const corner = (handle as HTMLElement).dataset.handle!;
        const handleEl = handle as HTMLElement;
        handleEl.setPointerCapture((e as PointerEvent).pointerId);

        const startClientX = (e as PointerEvent).clientX;
        const startClientY = (e as PointerEvent).clientY;
        const startLeft = overlay.offsetLeft;
        const startTop = overlay.offsetTop;
        const startW = overlay.offsetWidth;
        const startH = overlay.offsetHeight;
        const minW = 40;
        const minH = 20;

        const onMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startClientX;
          const dy = ev.clientY - startClientY;

          let newLeft = startLeft;
          let newTop = startTop;
          let newW = startW;
          let newH = startH;

          switch (corner) {
            case 'se':
              newW = Math.max(minW, startW + dx);
              newH = Math.max(minH, startH + dy);
              break;
            case 'sw':
              newW = Math.max(minW, startW - dx);
              newH = Math.max(minH, startH + dy);
              if (newW >= minW) newLeft = startLeft + dx;
              break;
            case 'ne':
              newW = Math.max(minW, startW + dx);
              newH = Math.max(minH, startH - dy);
              if (newH >= minH) newTop = startTop + dy;
              break;
            case 'nw':
              newW = Math.max(minW, startW - dx);
              newH = Math.max(minH, startH - dy);
              if (newW >= minW) newLeft = startLeft + dx;
              if (newH >= minH) newTop = startTop + dy;
              break;
          }

          overlay.style.width = newW + 'px';
          overlay.style.height = newH + 'px';
          overlay.style.left = newLeft + 'px';
          overlay.style.top = newTop + 'px';
          posState.w = newW;
          posState.h = newH;
        };

        const onUp = () => {
          handleEl.removeEventListener('pointermove', onMove);
          handleEl.removeEventListener('pointerup', onUp);
          // Save position as percentage
          const pageRect = lastPage.getBoundingClientRect();
          posState.x = overlay.offsetLeft / pageRect.width;
          posState.y = overlay.offsetTop / pageRect.height;
        };

        handleEl.addEventListener('pointermove', onMove);
        handleEl.addEventListener('pointerup', onUp);
      });
    });
  }

  private openFullScreenPreview(): void {
    const modal = document.createElement('div');
    modal.className = 'fcct-modal';
    modal.innerHTML = `
      <div class="fcct-modal__overlay"></div>
      <div class="fcct-modal__content">
        <div class="fcct-modal__header">
          <span class="fcct-modal__title">Document Preview</span>
          <button class="btn btn--ghost btn--sm fcct-modal__close">×</button>
        </div>
        <div class="fcct-modal__body">
          ${this.previewEl.innerHTML}
        </div>
      </div>
    `;

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
      if (key === 'currency') return val || this.currencySymbol;
      return val || `{{${key}}}`;
    });
  }

  private formatBody(text: string): string {
    return text
      .split('\n\n')
      .map(p => {
        if (p.startsWith('- ') || p.startsWith('1. ') || p.startsWith('✓ ')) {
          const items = p.split('\n').map(line => `<li>${line.replace(/^[-\d.]+\s*|^✓\s*/, '')}</li>`).join('');
          return `<ul>${items}</ul>`;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      })
      .join('');
  }

  private buildSignatureHTML(): string {
    const makeSig = (dataUrl: string | null, label: string, sigId: string) => {
      const img = dataUrl
        ? `<img src="${dataUrl}" class="fcct-sig-img fcct-sig-img--draggable" data-sig-id="${sigId}" style="max-width:${this.sigSize}px;cursor:grab;">`
        : `<div class="fcct-sig-line" style="width:${this.sigSize}px"></div>`;
      return `<div class="fcct-sig-block-print" data-sig-block="${sigId}">${img}<p>${label}</p><p>Date: _______________</p></div>`;
    };
    return `<div class="fcct-sigs-print">${makeSig(this.sigDataUrl, 'Contractor Signature', 'contractor')}${makeSig(this.clientSigDataUrl, 'Client Signature', 'client')}</div>`;
  }

  private buildExportHTML(): string {
    const def = TEMPLATES[this.templateSelect.value];
    const content = this.previewEl.innerHTML;
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${def.name}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; margin: 0; padding: 0; color: #1a1a1a; line-height: 1.6; font-size: 12px; }
  .fcct-paper__header { display: flex; align-items: center; gap: 16px; text-align: left; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1a1a1a; }
  .fcct-paper__logo { flex-shrink: 0; }
  .fcct-paper__header-text { flex: 1; }
  h1 { font-size: 20px; text-align: center; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px; }
  .fcct-paper__date, .fcct-paper__parties { font-size: 10px; color: #666; margin: 2px 0; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 6px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  p { margin: 5px 0; }
  ul { margin: 5px 0 5px 20px; }
  li { margin: 2px 0; }
  .fcct-section { page-break-inside: avoid; margin-bottom: 12px; }
  .fcct-page-break { page-break-before: always; border: none; margin: 0; padding: 0; height: 0; overflow: hidden; }
  .fcct-sigs-print { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .fcct-sig-block-print { text-align: center; }
  .fcct-sig-img { object-fit: contain; display: block; margin: 0 auto 6px; }
  .fcct-sig-line { height: 1px; background: #1a1a1a; margin: 45px auto 6px; }
  .fcct-sig-block-print p { font-size: 11px; color: #555; margin: 3px 0; }
  .fcct-watermark { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; }
  .fcct-watermark-text { font-size: 72px; font-family: 'Georgia', serif; color: rgba(0,0,0,0.06); transform: rotate(-45deg); text-transform: uppercase; letter-spacing: 10px; white-space: nowrap; }
</style></head><body>${content}</body></html>`;
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
      // ponytail: fallback for browsers that don't support ClipboardItem
      navigator.clipboard.writeText(this.previewEl.innerText);
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

      let page = pdf.addPage([595, 842]); // A4
      const { width, height } = page.getSize();
      const margin = 50;
      const maxWidth = width - margin * 2;
      let y = height - margin;

      // Helper: embed image with format detection (fetch-first, atob fallback)
      const embedImage = async (dataUrl: string): Promise<any> => {
        try {
          const response = await fetch(dataUrl);
          const bytes = await response.arrayBuffer();
          return dataUrl.startsWith('data:image/png')
            ? await pdf.embedPng(bytes)
            : await pdf.embedJpg(bytes);
        } catch {
          const base64 = dataUrl.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return dataUrl.startsWith('data:image/png')
            ? await pdf.embedPng(bytes)
            : await pdf.embedJpg(bytes);
        }
      };

      // Embed logo if present
      let logoImage: any = null;
      if (this.logoDataUrl) {
        try {
          logoImage = await embedImage(this.logoDataUrl);
        } catch {
          Toast.info('Logo image could not be embedded in PDF');
        }
      }

      // Embed signatures if present
      let sigImage: any = null;
      let clientSigImage: any = null;
      if (this.sigDataUrl) {
        try {
          sigImage = await embedImage(this.sigDataUrl);
        } catch {
          Toast.info('Signature image could not be embedded in PDF');
        }
      }
      if (this.clientSigDataUrl) {
        try {
          clientSigImage = await embedImage(this.clientSigDataUrl);
        } catch {
          Toast.info('Client signature image could not be embedded in PDF');
        }
      }

      // Helpers
      const checkPage = (needed: number) => {
        if (y - needed < margin) {
          page = pdf.addPage([595, 842]);
          y = height - margin;
          // Draw watermark on new page
          if (this.watermarkText) drawWatermark();
        }
      };

      const drawWrapped = (text: string, x: number, size: number, isBold = false, isItalic = false): number => {
        const f = isBold ? boldFont : isItalic ? italicFont : font;
        const words = text.split(' ');
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

      const drawWatermark = () => {
        if (!this.watermarkText) return;
        const wmSize = 48;
        const wmWidth = font.widthOfTextAtSize(this.watermarkText, wmSize);
        // Draw at center, rotated -45 degrees
        page.drawText(this.watermarkText, {
          x: width / 2 - wmWidth / 4,
          y: height / 2,
          size: wmSize,
          font,
          color: rgb(0.75, 0.75, 0.75),
          opacity: 0.15,
          rotate: degrees(-45),
        });
      };

      // Draw watermark on first page
      drawWatermark();

      // Header
      if (logoImage) {
        const logoH = this.logoSize;
        const logoW = logoImage.scale(logoH).width;
        checkPage(logoH + 10);
        page.drawImage(logoImage, {
          x: margin,
          y: y - logoH,
          width: logoW,
          height: logoH,
        });
        // Title next to logo
        const titleX = margin + logoW + 16;
        page.drawText(def.name.toUpperCase(), {
          x: titleX,
          y: y - 14,
          size: 18,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= logoH + 10;
      } else {
        checkPage(30);
        const titleWidth = boldFont.widthOfTextAtSize(def.name.toUpperCase(), 18);
        page.drawText(def.name.toUpperCase(), {
          x: width / 2 - titleWidth / 2,
          y,
          size: 18,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= 25;
      }

      // Date and parties
      const dateVal = this.currentVars['date'] || '';
      const formattedDate = dateVal
        ? new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';
      const clientName = this.currentVars['client_name'] || this.currentVars['disclosing_party'] || '';

      if (formattedDate) {
        checkPage(16);
        page.drawText(formattedDate, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
        y -= 14;
      }
      if (clientName) {
        checkPage(16);
        page.drawText(`Prepared for: ${clientName}`, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
        y -= 14;
      }

      // Divider
      y -= 5;
      checkPage(10);
      page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1.5, color: rgb(0, 0, 0) });
      y -= 20;

      // Sections
      for (const section of def.sections) {
        let body = section.body;
        body = this.processConditionals(body);
        body = this.substituteVars(body);

        // Section heading
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

        // Body paragraphs
        const paragraphs = body.split('\n\n');
        for (const para of paragraphs) {
          const lines = para.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            // List items
            if (trimmed.startsWith('- ') || trimmed.startsWith('✓ ')) {
              const itemText = trimmed.replace(/^[-✓]\s*/, '');
              checkPage(14);
              page.drawText('•', { x: margin + 8, y, size: 10, font, color: rgb(0, 0, 0) });
              drawWrapped(itemText, margin + 20, 10);
            } else if (/^\d+\.\s/.test(trimmed)) {
              const itemText = trimmed.replace(/^\d+\.\s*/, '');
              const num = trimmed.match(/^(\d+)\./)?.[1] || '';
              checkPage(14);
              page.drawText(`${num}.`, { x: margin + 8, y, size: 10, font, color: rgb(0, 0, 0) });
              drawWrapped(itemText, margin + 24, 10);
            } else {
              drawWrapped(trimmed, margin, 10);
            }
          }
          y -= 6; // spacing between paragraphs
        }
        y -= 8; // spacing between sections
      }

      // Signatures — using overlay positions
      if (def.hasSignature) {
        // Contractor signature
        if (sigImage) {
          const pdfX = this.contractorSigPos.x * width;
          const pdfY = height - (this.contractorSigPos.y * height) - this.contractorSigPos.h;
          page.drawImage(sigImage, {
            x: pdfX,
            y: pdfY,
            width: this.contractorSigPos.w,
            height: this.contractorSigPos.h,
          });
          page.drawText('Contractor Signature', { x: pdfX, y: pdfY - 12, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
          page.drawText('Date: _______________', { x: pdfX, y: pdfY - 22, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
        }

        // Client signature
        if (clientSigImage) {
          const pdfX = this.clientSigPos.x * width;
          const pdfY = height - (this.clientSigPos.y * height) - this.clientSigPos.h;
          page.drawImage(clientSigImage, {
            x: pdfX,
            y: pdfY,
            width: this.clientSigPos.w,
            height: this.clientSigPos.h,
          });
          page.drawText('Client Signature', { x: pdfX, y: pdfY - 12, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
          page.drawText('Date: _______________', { x: pdfX, y: pdfY - 22, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
        }
      }

      // Save and download
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const name = def.name.replace(/\s+/g, '-').toLowerCase();
      downloadBlob(blob, `${name}.pdf`);
      Toast.success('PDF downloaded');
      logToolAction('contract-templates', 'Exported contract as PDF');
    } catch (e) {
      console.error('PDF export failed:', e);
      Toast.error('PDF export failed');
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export PDF';
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
  .fcct-sigs-print { display: table; width: 100%%; margin-top: 30pt; }
  .fcct-sig-block-print { display: table-cell; width: 50%%; text-align: center; vertical-align: top; }
  .fcct-sig-img { max-width: 180px; height: 50px; }
  .fcct-sig-line { width: 180px; height: 1pt; background: #1a1a1a; margin: 40pt auto 6pt; }
  .fcct-sig-block-print p { font-size: 9pt; color: #555; margin: 3pt 0; }
</style></head><body>${this.previewEl.innerHTML}</body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-word' });
    const name = TEMPLATES[this.templateSelect.value].name.replace(/\s+/g, '-').toLowerCase();
    downloadBlob(blob, `${name}.doc`);
    Toast.success('DOCX exported');
    logToolAction('contract-templates', 'Exported contract as DOCX');
  }

  destroy(): void {}
}

import type { ToolInfo } from '../../types/index';

export const FREELANCE_CORE_TOOL_DATA: Record<string, ToolInfo> = {
  'invoice-generator': {
    useCases: ['Whipping up a professional invoice for a client project', 'Tracking line items and totals without spreadsheet headaches', 'Generating itemized bills for multi-phase projects', 'Quick one-off invoice when a client asks "can you send me a bill?"'],
    tips: ['Always include payment terms — net 30 saves awkward follow-ups', 'Add your tax rate before calculating so the total is accurate', 'Keep invoice numbers sequential — your accountant will thank you', 'Copy and send as text for fast turnaround'],
    related: ['rate-calculator', 'expense-tracker'],
  },
  'rate-calculator': {
    useCases: ['Figuring out what you should actually charge per hour', 'Factoring in overhead and taxes so you\'re not losing money', 'Determining project pricing that covers your costs', 'Comparing freelance income vs what you\'d make full-time'],
    tips: ['Add 20-30% on top for overhead — it adds up faster than you think', 'Factor in unpaid time like vacations and sick days', 'Tax rate depends on where you live — check your local rules', 'Revisit your rates at least once a year'],
    related: ['invoice-generator', 'client-manager'],
  },
  'time-tracker': {
    useCases: ['Tracking hours on client projects so billing is accurate', 'Building a paper trail for hourly work', 'Spotting where your time actually goes each week', 'Generating timesheets to pair with invoices'],
    tips: ['Start the timer the moment you start working — don\'t trust your memory', 'Add notes so future-you remembers what those hours were for', 'Weekly reviews reveal time sinks you didn\'t know existed', 'Use consistent project names across all your tracking'],
    related: ['expense-tracker', 'invoice-generator'],
  },
  'expense-tracker': {
    useCases: ['Logging business expenses before you forget them', 'Keeping spending organized by category for tax season', 'Tracking deductible expenses so you don\'t leave money on the table', 'Monitoring monthly budgets to stay on track'],
    tips: ['Log expenses right away — receipts disappear faster than you think', 'Consistent categories make tax time way less painful', 'Keep receipts for anything over your local threshold', 'Review your categories monthly to catch miscategorized items'],
    related: ['time-tracker', 'rate-calculator'],
  },
  'contract-templates': {
    useCases: ['Starting a new gig? Get a contractor agreement in minutes', 'Need a Statement of Work? Template handles the structure', 'Non-Disclosure for when clients share sensitive stuff', 'Writing a project proposal with budget and timeline', 'Formalizing project sign-off and final acceptance', 'Creating a Master Services Agreement for ongoing work', 'Defining uptime guarantees with an SLA', 'Hiring a subcontractor with proper IP and confidentiality terms'],
    tips: ['Use toggles to show/hide optional sections — keeps templates flexible', 'Fill in the date fields with the date picker for consistent formatting', 'Signatures embed in PDF and DOCX exports — draw, type, or upload', 'Export as DOCX for clients who need to edit, PDF for final versions', 'Copy Formatted pastes rich text into email or docs with formatting intact', 'Long templates (MSA, SLA) have detailed legal clauses — review and customize', 'Keep signed copies somewhere safe — you\'ll need them eventually'],
    related: ['client-manager', 'invoice-generator'],
  },
  'client-manager': {
    useCases: ['Keeping all your client info in one place instead of scattered everywhere', 'Tracking project status and notes as things move along', 'Maintaining a history of what you\'ve done for each client', 'Separating active work from completed projects'],
    tips: ['Update project status as you go — don\'t let it pile up', 'Add detailed notes after calls while it\'s still fresh', 'Keep contact info current — people change roles and emails', 'Review your client list monthly to spot patterns'],
    related: ['contract-templates', 'invoice-generator'],
  },
  'tax-estimator': {
    useCases: ['Estimating how much you\'ll owe in federal taxes this year', 'Understanding how tax brackets actually work', 'Planning quarterly estimated tax payments', 'Comparing take-home pay between single and married filing'],
    tips: ['This is an estimate — state taxes and deductions are not included', 'The bar chart shows which brackets your income falls into', 'Effective rate is always lower than your marginal rate', 'Use this to set aside the right amount each month for taxes'],
    related: ['rate-calculator', 'expense-tracker'],
  },
  'timezone-converter': {
    useCases: ['Scheduling a meeting across 3 time zones without confusion', 'Figuring out when it\'s business hours for your remote team', 'Converting a deadline from your client\'s timezone to yours', 'Planning calls with international collaborators'],
    tips: ['Pick up to 4 time zones to compare at once', 'Use "Now" to see current times across all zones instantly', 'The datetime-local input converts any past or future time', 'All timezone names use the IANA standard (e.g., America/New_York)'],
    related: ['time-tracker', 'tax-estimator'],
  },
  'project-manager': {
    useCases: ['Seeing all your projects across every client in one view', 'Creating a new project without going into each client separately', 'Tracking which projects are active, completed, or archived', 'Jumping straight to time tracking for any project'],
    tips: ['Use the filter tabs to focus on active work only', 'Click "Track Time →" to start logging hours against a project', 'Set deadlines to see urgent projects highlighted in red', 'Projects created here also appear in Client Manager and Time Tracker'],
    related: ['client-manager', 'time-tracker', 'invoice-generator'],
  },
};

export function getFreelanceCoreToolInfo(toolId: string): ToolInfo {
  return FREELANCE_CORE_TOOL_DATA[toolId] || { useCases: [], tips: [], related: [] };
}

import type { ToolInfo } from '../../types/index';

export const TOOL_DATA: Record<string, ToolInfo> = {
  'json-formatter': {
    useCases: [
      'Stuck debugging an API response? Paste it here and everything becomes readable',
      'Production ships minified JSON — this unpacks it instantly',
      'Great for double-checking config files before you deploy',
      'Clean JSON makes your docs actually usable',
    ],
    tips: [
      'Just paste — it formats automatically as you type',
      'Minify mode shrinks payloads when you need compact output',
      'Validation catches syntax errors before they hit production',
      'One click to copy the clean version to your clipboard',
    ],
    related: ['base64', 'markdown-preview'],
  },
  base64: {
    useCases: [
      'Need to encode credentials for a Basic Auth header? Right here',
      'Embed images inline as data URIs without leaving the browser',
      'Safely send binary data over text-only channels',
      'Decode those mystery strings hiding in legacy systems',
    ],
    tips: [
      'Handles Unicode properly — no weird character mangling',
      'Super handy for encoding API keys in HTTP headers',
      'Invalid Base64 shows a clear error instead of garbage output',
      'Works entirely offline, nothing leaves your browser',
    ],
    related: ['hash-generator', 'url-encoder'],
  },
  'hash-generator': {
    useCases: [
      'Did that file transfer actually work? Check the hash',
      'Generate checksums for build artifacts to verify integrity',
      'Create unique identifiers from any input string',
      'Quick equality check between two pieces of text',
    ],
    tips: [
      'SHA-256 is the go-to for most verification tasks',
      "MD5 is fast but don't trust it for security — fine for checksums",
      'Great for generating cache keys or ETags',
      'Each algorithm has its own copy button',
    ],
    related: ['uuid-generator', 'base64'],
  },
  'uuid-generator': {
    useCases: [
      'Need unique IDs for your database? Generate a batch instantly',
      'Create session tokens or request identifiers in bulk',
      'Populate test fixtures with realistic-looking data',
      'Generate unique filenames or resource paths',
    ],
    tips: [
      'Generate up to 100 at once — no more manual copy-paste loops',
      'Pick your format: lowercase, uppercase, or with braces',
      'Download the whole batch as a text file',
      'v4 UUIDs are randomly generated — collisions are practically impossible',
    ],
    related: ['hash-generator', 'password-gen'],
  },
  'lorem-ipsum': {
    useCases: [
      'Filling a mockup with placeholder text so it actually looks finished',
      'Testing how your UI handles text wrapping and overflow',
      'Generating sample content for staging environments',
      'Quick dummy text for form input testing',
    ],
    tips: [
      'Choose paragraphs, sentences, or words depending on what you need',
      'Classic Lorem Ipsum — straight from Cicero, 45 BC',
      'Download output as a text file if you need a bunch of it',
      'Copy and drop it right into your design',
    ],
    related: ['char-counter', 'markdown-preview'],
  },
  'char-counter': {
    useCases: [
      'Is this tweet going to blow past 280 characters? Check here',
      "Estimating reading time for that blog post you're writing",
      'Counting words for an academic paper or assignment',
      'Verifying textarea input limits before implementing them',
    ],
    tips: [
      'Updates live as you type — no submit button needed',
      'Reading time assumes 200 words/min (average adult pace)',
      'Speaking time uses 150 words/min for presentations',
      'Paragraphs are counted by double newlines',
    ],
    related: ['lorem-ipsum', 'markdown-preview'],
  },
  'url-encoder': {
    useCases: [
      'Building an API request with special characters in the URL',
      'Parsing a URL to understand its structure',
      'Debugging why your query parameters are broken',
      'Encoding Unicode characters in URL paths',
    ],
    tips: [
      'Parse mode breaks down protocol, host, path, and query params',
      'Query parameters display as clean key=value pairs',
      'Encode or decode individual URL components separately',
      'Handles Unicode characters correctly — no mojibake',
    ],
    related: ['base64', 'markdown-html'],
  },
  'markdown-preview': {
    useCases: [
      'Preview your README before pushing it to GitHub',
      'Write documentation with instant visual feedback',
      'Test GFM features like tables, strikethrough, and task lists',
      'Format content for blogs, wikis, or CMS platforms',
    ],
    tips: [
      'Supports full GitHub Flavored Markdown — tables, task lists, the works',
      'Preview updates as you type, no button mashing',
      'Copy the rendered HTML output with one click',
      'Code blocks preserve syntax class attributes',
    ],
    related: ['markdown-html', 'json-formatter'],
  },
  'markdown-html': {
    useCases: [
      'Turning markdown docs into HTML for your CMS or email templates',
      'Converting markdown content for platforms that only accept HTML',
      'Batch-converting markdown files to clean HTML',
      'Generating HTML from markdown templates',
    ],
    tips: [
      'Handles headers, bold, italic, links, and lists',
      'Blockquotes become proper <blockquote> elements',
      'Code blocks keep their formatting intact',
      'Copy the HTML output straight into your project',
    ],
    related: ['markdown-preview', 'url-encoder'],
  },
  'password-gen': {
    useCases: [
      'Need a strong password right now? Generate one instantly',
      'Creating API keys or tokens for your app',
      'Generating random strings for test data',
      'Building memorable passphrases',
    ],
    tips: [
      'Slider goes from 4 to 64 characters — find your sweet spot',
      'Toggle uppercase, lowercase, numbers, and symbols independently',
      'Strength meter shows you how tough the password actually is',
      'Generate 5 at once and pick your favorite',
    ],
    related: ['uuid-generator', 'hash-generator'],
  },
  'css-unit': {
    useCases: [
      'Converting px to rem for responsive typography',
      'Calculating viewport units for fluid layouts',
      "Debugging CSS unit values that don't look right",
      'Converting between pt, cm, and mm for print stylesheets',
    ],
    tips: [
      'Set your base font size (defaults to 16px)',
      'Viewport width input makes vw/vh calculations accurate',
      'All 10 unit conversions shown at once — no switching tabs',
      'Copy values with the unit suffix included',
    ],
    related: ['json-formatter', 'css-gradient'],
  },
  scratchpad: {
    useCases: [
      'Quick notes during a call or meeting',
      'Drafting email replies or documentation',
      'Storing code snippets and terminal commands',
      'Linking notes to specific clients or projects',
    ],
    tips: [
      'Double-click a note title to rename it inline',
      'Use the toolbar to quickly insert markdown formatting',
      'Toggle Preview to see rendered markdown',
      'Link notes to clients or projects for organized context',
    ],
    related: ['markdown-preview', 'json-formatter'],
  },
  'pdf-merge': {
    useCases: [
      'Combining multiple invoice PDFs into a single document',
      'Merging contract appendices into one file',
      'Joining chapter PDFs into a complete book',
      'Consolidating reports from different departments',
    ],
    tips: [
      'Drag files to reorder them before merging',
      'Each file shows its page count so you know what you are combining',
      'Encrypted PDFs are loaded with ignoreEncryption for maximum compatibility',
      'The merged file preserves all pages from all source PDFs',
    ],
    related: ['pdf-split', 'pdf-compress'],
  },
  'pdf-split': {
    useCases: [
      'Extracting specific chapters from a long PDF',
      'Splitting a scanned document into individual pages',
      'Pulling out just the signature page from a contract',
      'Breaking a large PDF into smaller files for email',
    ],
    tips: [
      'Click a page to select it, click again to deselect',
      'Each page shows a canvas preview so you can see what you are keeping',
      'Selected pages get an accent highlight and checkmark',
      'Pages are extracted in order regardless of selection order',
    ],
    related: ['pdf-merge', 'pdf-compress'],
  },
  'pdf-compress': {
    useCases: [
      'Reducing PDF size before uploading to a file sharing service',
      'Making email attachments smaller',
      'Stripping unnecessary metadata from exported reports',
      'Optimizing PDFs generated by heavy tools',
    ],
    tips: [
      'Client-side compression strips metadata and unused objects — not image re-encoding',
      'Savings depend heavily on how the PDF was originally created',
      'The tool shows before/after size so you can see actual reduction',
      'For image-heavy PDFs, consider using pdf-to-images and re-compressing the images',
    ],
    related: ['pdf-merge', 'pdf-metadata'],
  },
  'pdf-sign': {
    useCases: [
      'Signing a contract before sending it back',
      'Adding your signature to a completed form',
      'Visually approving a document with your mark',
      'Quick signing without printing and scanning',
    ],
    tips: [
      'Draw your signature with mouse or touch for a natural look',
      'Type your name and pick a cursive font for a clean signature',
      'Drag the signature overlay to position it exactly where you need it',
      'This is a visual signature, not a cryptographic digital signature',
    ],
    related: ['pdf-merge', 'pdf-metadata'],
  },
  'pdf-metadata': {
    useCases: [
      'Updating the title and author on a team report before distribution',
      'Stripping metadata from a PDF before sharing publicly',
      'Checking what information is embedded in a received PDF',
      'Adding keywords to a document for better organization',
    ],
    tips: [
      'Keywords are comma-separated and stored as an array internally',
      'Strip All removes every metadata field in one click',
      'The file info panel shows page count, page size, and file size',
      'Metadata changes do not affect the visual content of the PDF',
    ],
    related: ['pdf-compress', 'pdf-sign'],
  },
  'qr-generator': {
    useCases: [
      'Generating a QR code for your website URL to put on business cards',
      'Creating QR codes for event tickets or registration links',
      'Making scannable Wi-Fi passwords for guests',
      'Adding QR codes to printed marketing materials',
    ],
    tips: [
      'Higher error correction (H) makes QR codes scannable even when partially obscured',
      'Use dark foreground on light background for best scan reliability',
      'SVG export gives you infinite scaling for print',
      'Keep URLs short for simpler QR codes that scan faster',
    ],
    related: ['uuid-generator', 'hash-generator'],
  },
  'md-table': {
    useCases: [
      'Converting a markdown table from your README into a CSV for spreadsheet import',
      'Cleaning up messy markdown tables from documentation',
      'Converting CSV data into markdown tables for GitHub issues',
      'Quick format switching between markdown, CSV, and JSON',
    ],
    tips: [
      'Paste any markdown table — it auto-detects the separator row',
      'Copy as JSON to get an array of objects ready for API work',
      'The parsed preview shows exactly how the data will export',
      'Works with tab-separated and comma-separated values too',
    ],
    related: ['markdown-preview', 'json-formatter'],
  },
  'chart-creator': {
    useCases: [
      'Visualizing monthly revenue data from a spreadsheet',
      'Creating a pie chart showing budget allocation for a presentation',
      'Quick data visualization without opening Excel or Google Sheets',
      'Generating charts from markdown tables in documentation',
    ],
    tips: [
      'Paste data as markdown table, CSV, or tab-separated values',
      'Use the color scheme picker to match your brand or presentation theme',
      'Doughnut charts are great for showing parts of a whole with a center label',
      'Export at 2x resolution for crisp charts in presentations',
    ],
    related: ['json-formatter', 'md-table'],
  },
};

export function getToolInfo(toolId: string): ToolInfo {
  return TOOL_DATA[toolId] || { useCases: [], tips: [], related: [] };
}

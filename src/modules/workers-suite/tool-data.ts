import type { ToolInfo } from '../../types/index';

export const TOOL_DATA: Record<string, ToolInfo> = {
  'json-formatter': {
    useCases: ['Stuck debugging an API response? Paste it here and everything becomes readable', 'Production ships minified JSON — this unpacks it instantly', 'Great for double-checking config files before you deploy', 'Clean JSON makes your docs actually usable'],
    tips: ['Just paste — it formats automatically as you type', 'Minify mode shrinks payloads when you need compact output', 'Validation catches syntax errors before they hit production', 'One click to copy the clean version to your clipboard'],
    related: ['base64', 'markdown-preview'],
  },
  'base64': {
    useCases: ['Need to encode credentials for a Basic Auth header? Right here', 'Embed images inline as data URIs without leaving the browser', 'Safely send binary data over text-only channels', 'Decode those mystery strings hiding in legacy systems'],
    tips: ['Handles Unicode properly — no weird character mangling', 'Super handy for encoding API keys in HTTP headers', 'Invalid Base64 shows a clear error instead of garbage output', 'Works entirely offline, nothing leaves your browser'],
    related: ['hash-generator', 'url-encoder'],
  },
  'hash-generator': {
    useCases: ['Did that file transfer actually work? Check the hash', 'Generate checksums for build artifacts to verify integrity', 'Create unique identifiers from any input string', 'Quick equality check between two pieces of text'],
    tips: ['SHA-256 is the go-to for most verification tasks', 'MD5 is fast but don\'t trust it for security — fine for checksums', 'Great for generating cache keys or ETags', 'Each algorithm has its own copy button'],
    related: ['uuid-generator', 'base64'],
  },
  'uuid-generator': {
    useCases: ['Need unique IDs for your database? Generate a batch instantly', 'Create session tokens or request identifiers in bulk', 'Populate test fixtures with realistic-looking data', 'Generate unique filenames or resource paths'],
    tips: ['Generate up to 100 at once — no more manual copy-paste loops', 'Pick your format: lowercase, uppercase, or with braces', 'Download the whole batch as a text file', 'v4 UUIDs are randomly generated — collisions are practically impossible'],
    related: ['hash-generator', 'password-gen'],
  },
  'lorem-ipsum': {
    useCases: ['Filling a mockup with placeholder text so it actually looks finished', 'Testing how your UI handles text wrapping and overflow', 'Generating sample content for staging environments', 'Quick dummy text for form input testing'],
    tips: ['Choose paragraphs, sentences, or words depending on what you need', 'Classic Lorem Ipsum — straight from Cicero, 45 BC', 'Download output as a text file if you need a bunch of it', 'Copy and drop it right into your design'],
    related: ['char-counter', 'markdown-preview'],
  },
  'char-counter': {
    useCases: ['Is this tweet going to blow past 280 characters? Check here', 'Estimating reading time for that blog post you\'re writing', 'Counting words for an academic paper or assignment', 'Verifying textarea input limits before implementing them'],
    tips: ['Updates live as you type — no submit button needed', 'Reading time assumes 200 words/min (average adult pace)', 'Speaking time uses 150 words/min for presentations', 'Paragraphs are counted by double newlines'],
    related: ['lorem-ipsum', 'markdown-preview'],
  },
  'url-encoder': {
    useCases: ['Building an API request with special characters in the URL', 'Parsing a URL to understand its structure', 'Debugging why your query parameters are broken', 'Encoding Unicode characters in URL paths'],
    tips: ['Parse mode breaks down protocol, host, path, and query params', 'Query parameters display as clean key=value pairs', 'Encode or decode individual URL components separately', 'Handles Unicode characters correctly — no mojibake'],
    related: ['base64', 'markdown-html'],
  },
  'markdown-preview': {
    useCases: ['Preview your README before pushing it to GitHub', 'Write documentation with instant visual feedback', 'Test GFM features like tables, strikethrough, and task lists', 'Format content for blogs, wikis, or CMS platforms'],
    tips: ['Supports full GitHub Flavored Markdown — tables, task lists, the works', 'Preview updates as you type, no button mashing', 'Copy the rendered HTML output with one click', 'Code blocks preserve syntax class attributes'],
    related: ['markdown-html', 'json-formatter'],
  },
  'markdown-html': {
    useCases: ['Turning markdown docs into HTML for your CMS or email templates', 'Converting markdown content for platforms that only accept HTML', 'Batch-converting markdown files to clean HTML', 'Generating HTML from markdown templates'],
    tips: ['Handles headers, bold, italic, links, and lists', 'Blockquotes become proper <blockquote> elements', 'Code blocks keep their formatting intact', 'Copy the HTML output straight into your project'],
    related: ['markdown-preview', 'url-encoder'],
  },
  'password-gen': {
    useCases: ['Need a strong password right now? Generate one instantly', 'Creating API keys or tokens for your app', 'Generating random strings for test data', 'Building memorable passphrases'],
    tips: ['Slider goes from 4 to 64 characters — find your sweet spot', 'Toggle uppercase, lowercase, numbers, and symbols independently', 'Strength meter shows you how tough the password actually is', 'Generate 5 at once and pick your favorite'],
    related: ['uuid-generator', 'hash-generator'],
  },
  'css-unit': {
    useCases: ['Converting px to rem for responsive typography', 'Calculating viewport units for fluid layouts', 'Debugging CSS unit values that don\'t look right', 'Converting between pt, cm, and mm for print stylesheets'],
    tips: ['Set your base font size (defaults to 16px)', 'Viewport width input makes vw/vh calculations accurate', 'All 10 unit conversions shown at once — no switching tabs', 'Copy values with the unit suffix included'],
    related: ['json-formatter', 'css-gradient'],
  },
};

export function getToolInfo(toolId: string): ToolInfo {
  return TOOL_DATA[toolId] || { useCases: [], tips: [], related: [] };
}

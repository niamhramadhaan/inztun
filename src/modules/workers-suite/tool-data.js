export const TOOL_DATA = {
  'json-formatter': {
    useCases: ['Inspect and debug API responses', 'Format minified JSON from production', 'Validate configuration files', 'Pretty-print JSON for documentation'],
    tips: ['Paste any JSON and it auto-formats on input', 'Use Minify to reduce payload size', 'Validate catches syntax errors before deployment', 'Copy formatted output directly to clipboard'],
    related: ['base64', 'regex-tester'],
  },
  'base64': {
    useCases: ['Encode credentials for Basic Auth headers', 'Embed images inline as data URIs', 'Safely transmit binary data over text channels', 'Decode obfuscated strings in legacy systems'],
    tips: ['Supports Unicode characters — no data loss', 'Useful for encoding API keys in HTTP headers', 'Decoding invalid Base64 shows clear error message', 'Works entirely offline'],
    related: ['hash-generator', 'html-entity'],
  },
  'color-converter': {
    useCases: ['Convert brand colors between design tool formats', 'Match CSS colors to design specs', 'Generate color variations for themes', 'Debug color values in DevTools'],
    tips: ['Type any HEX value to see RGB and HSL equivalents', 'Use Random to discover new colors', 'Use the native color picker for visual selection', 'Copy individual formats for different contexts'],
    related: ['css-unit', 'regex-tester'],
  },
  'regex-tester': {
    useCases: ['Validate email, phone, or URL patterns', 'Extract specific data from log files', 'Test search-and-replace patterns', 'Debug complex regex with live highlighting'],
    tips: ['Live matching shows results as you type', 'Use flags like g (global) and i (case-insensitive)', 'Common patterns dropdown for quick access', 'Matched text is highlighted inline'],
    related: ['json-formatter', 'text-case'],
  },
  'hash-generator': {
    useCases: ['Verify file integrity after transfer', 'Generate checksums for build artifacts', 'Create unique identifiers from input data', 'Compare strings for equality securely'],
    tips: ['SHA-256 is most commonly used for verification', 'MD5 is fast but not cryptographically secure', 'Use for generating cache keys or ETags', 'Each hash algorithm has separate copy button'],
    related: ['uuid-generator', 'base64'],
  },
  'uuid-generator': {
    useCases: ['Generate unique IDs for database records', 'Create session tokens or request identifiers', 'Populate test fixtures with realistic data', 'Generate unique filenames or resource paths'],
    tips: ['Generate up to 100 UUIDs at once', 'Choose format: lowercase, uppercase, or with braces', 'Download all UUIDs as a text file', 'v4 UUIDs are randomly generated — practically unique'],
    related: ['hash-generator', 'timestamp'],
  },
  'timestamp': {
    useCases: ['Convert Unix timestamps from logs or APIs', 'Debug time-related issues in applications', 'Calculate time differences between events', 'Generate timestamps for scheduling'],
    tips: ['Live clock shows current Unix timestamp', 'Relative time shows "X hours ago" or "in X days"', 'Paste any timestamp to convert to human-readable', 'Use "Use Current" to grab exact timestamp now'],
    related: ['uuid-generator', 'json-formatter'],
  },
  'lorem-ipsum': {
    useCases: ['Fill mockup designs with placeholder text', 'Test text wrapping and overflow in UI', 'Generate sample content for staging', 'Create test data for form inputs'],
    tips: ['Choose between paragraphs, sentences, or words', 'Classic Lorem Ipsum based on Cicero\'s writing', 'Download output as text file', 'Copy output directly into your design'],
    related: ['char-counter', 'text-case'],
  },
  'text-case': {
    useCases: ['Convert variable names between conventions', 'Format text for different contexts (titles, URLs)', 'Standardize naming across codebase', 'Prepare text for constants or identifiers'],
    tips: ['Click any result to select it', 'Supports camelCase, snake_case, kebab-case, PascalCase', 'Also has CONSTANT_CASE, dot.case, path/case', 'Alternating case for fun or emphasis'],
    related: ['char-counter', 'lorem-ipsum'],
  },
  'char-counter': {
    useCases: ['Check tweet/post character limits', 'Estimate reading time for articles', 'Count words for academic papers', 'Verify textarea input limits'],
    tips: ['Updates in real-time as you type', 'Shows reading time at 200 words/min', 'Shows speaking time at 150 words/min', 'Counts paragraphs by double newlines'],
    related: ['text-case', 'lorem-ipsum'],
  },
  'html-entity': {
    useCases: ['Encode HTML for safe display in web pages', 'Decode entities from scraped content', 'Prepare text for HTML templates', 'Debug entity encoding issues'],
    tips: ['Encode converts special chars to &amp; &lt; etc.', 'Decode reverses entities back to characters', 'Supports numeric entities (&#xx;) too', 'Copy encoded output directly'],
    related: ['base64', 'url-encoder'],
  },
  'url-encoder': {
    useCases: ['Encode URLs for API requests', 'Parse URL structure to extract components', 'Debug query parameter issues', 'Encode special characters in URL paths'],
    tips: ['Parse URL breaks down protocol, host, path, params', 'Query parameters shown as key=value pairs', 'Encode/decode individual URL components', 'Handles Unicode characters correctly'],
    related: ['base64', 'html-entity'],
  },
  'jwt-decoder': {
    useCases: ['Debug authentication tokens in APIs', 'Inspect JWT payload without server', 'Check token expiration times', 'Verify JWT header algorithm'],
    tips: ['Paste any JWT to decode header and payload', 'Shows if token is expired (red indicator)', 'Algorithm name displayed from header', 'Copy individual sections separately'],
    related: ['base64', 'hash-generator'],
  },
  'markdown-preview': {
    useCases: ['Preview README files before committing', 'Write documentation with live feedback', 'Test GitHub-flavored markdown rendering', 'Format content for blogs or wikis'],
    tips: ['Supports GFM: tables, strikethrough, task lists', 'Live preview updates as you type', 'Copy generated HTML output', 'Code blocks with syntax class support'],
    related: ['markdown-html', 'json-formatter'],
  },
  'markdown-html': {
    useCases: ['Convert markdown documentation to HTML', 'Prepare content for CMS or email', 'Generate HTML from markdown templates', 'Batch convert markdown files'],
    tips: ['Converts headers, bold, italic, links, lists', 'Blockquotes become <blockquote> elements', 'Code blocks preserve formatting', 'Copy HTML output directly'],
    related: ['markdown-preview', 'html-entity'],
  },
  'password-gen': {
    useCases: ['Generate secure passwords for accounts', 'Create API keys or tokens', 'Generate random strings for testing', 'Create memorable passphrases'],
    tips: ['Adjust length with slider (4-64 characters)', 'Toggle uppercase, lowercase, numbers, symbols', 'Strength meter shows password quality', 'Generate 5 passwords at once for comparison'],
    related: ['uuid-generator', 'hash-generator'],
  },
  'number-base': {
    useCases: ['Convert hex color values to decimal', 'Debug binary flags in programming', 'Convert between number systems', 'Work with IP addresses or subnet masks'],
    tips: ['Supports binary (2), octal (8), decimal (10), hex (16)', 'Select input base from dropdown', 'All conversions update instantly', 'Copy any converted value'],
    related: ['css-unit', 'color-converter'],
  },
  'css-unit': {
    useCases: ['Convert px to rem for responsive design', 'Calculate viewport units for layouts', 'Debug CSS unit values', 'Convert between pt, cm, mm for print'],
    tips: ['Set base font size (default 16px)', 'Set viewport width for vw/vh calculations', 'All 10 unit conversions shown at once', 'Copy values with unit suffix included'],
    related: ['color-converter', 'number-base'],
  },
};

export function getToolInfo(toolId) {
  return TOOL_DATA[toolId] || { useCases: [], tips: [], related: [] };
}

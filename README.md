# ✦ inztun

> **The Artisan's Operating System** — A privacy-first, client-side workspace for freelancers, marketers, and designers.

<div align="center">

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8)

</div>

---

## ◈ Philosophy

The modern web is bloated with tracking, forced logins, and intrusive scripts.

**inztun** is different:

- ✦ **Zero data exfiltration** — Everything runs locally in your browser
- ✦ **No accounts required** — Just open and use
- ✦ **Handmade Web** — TypeScript, native Browser APIs, no frameworks
- ✦ **Privacy by design** — Nothing leaves your device

---

## ◈ Modules

### 🏠 Home

*Personal dashboard with activity tracking, favorites, and quick actions*

<!-- SCREENSHOT: home/dashboard.png -->
![Home Dashboard](screenshots/home/dashboard.png)

| Feature | Description |
|---------|-------------|
| Greeting | Time-aware welcome message |
| Quick Actions | Jump to any tool instantly |
| Favorites | Pin your most-used tools |
| Activity Feed | Recent tool usage history |
| Stats Overview | Usage metrics at a glance |

---

### ⚡ Worker's Suite

*21 developer utilities organized by category*

<!-- SCREENSHOT: workers-suite/overview.png -->
![Worker's Suite](screenshots/workers-suite/overview.png)

| Category | Tools |
|----------|-------|
| **Text & Writing** | Lorem Ipsum, Text Case Converter, Character Counter, Scratchpad |
| **Encoding & Decoding** | Base64, URL Encoder |
| **Data & Format** | JSON Formatter, MD Table Converter, Chart Creator |
| **Markdown** | Markdown Preview (GFM), Markdown to HTML |
| **Generators** | UUID, Hash (SHA-256/SHA-1), Password, QR Code |
| **PDF Tools** | Merge, Split, Compress, Sign, Metadata Editor |
| **Developer Utilities** | Regex Tester, Color Converter, CSS Unit Converter |

---

### 🎨 Design Studio

*16 tools for visual design and brand identity*

<!-- SCREENSHOT: design-studio/overview.png -->
![Design Studio](screenshots/design-studio/overview.png)

| Category | Tools |
|----------|-------|
| **Image Tools** | Crop, Resize, Compress, Convert, Filters, Metadata Viewer |
| **Brand & Identity** | Brand Guidelines Generator, Logo Builder, Favicon Generator |
| **Typography** | Font Pairer, Typography Scale |
| **CSS & Layout** | CSS Gradient Builder, Border Radius Previewer, Spacing System |
| **Accessibility** | Contrast Checker (WCAG AA/AAA) |

---

### 📣 Marketing Lab

*8 tools for campaign tracking and social media*

<!-- SCREENSHOT: marketing-lab/overview.png -->
![Marketing Lab](screenshots/marketing-lab/overview.png)

| Tool | Description |
|------|-------------|
| UTM Builder | Campaign URL tagging with copy-ready links |
| SEO Meta Generator | Title tags, descriptions, Open Graph tags |
| OG Preview | See how links appear on social platforms |
| Social Counter | Character limits for every platform |
| Social Resizer | Crop images to platform-specific dimensions |
| Social Scheduler | Content calendar with export to CSV |
| Color Palette | Harmonies, schemes, and 60-30-10 rule builder |
| Brand Extractor | Pull colors, fonts, and meta from any URL |

---

### 💼 Freelance Core

*9 tools for managing your freelance business*

<!-- SCREENSHOT: freelance-core/overview.png -->
![Freelance Core](screenshots/freelance-core/overview.png)

| Tool | Description |
|------|-------------|
| Invoice Generator | Itemized invoices with tax calculations |
| Time Tracker | Log hours per project with notes |
| Expense Tracker | Business expenses by category |
| Client Manager | Contact info, projects, and notes |
| Project Manager | All projects across clients in one view |
| Rate Calculator | Hourly and project-based pricing |
| Tax Estimator | Federal tax brackets and effective rate |
| Contract Templates | 8 templates (NDA, SOW, MSA, SLA, and more) |
| Timezone Converter | Compare up to 4 time zones |

---

### 🎮 Playground

*3 creative and experimental tools*

<!-- SCREENSHOT: playground/overview.png -->
![Playground](screenshots/playground/overview.png)

| Tool | Description |
|------|-------------|
| Typing Test | WPM and accuracy tracking |
| Banner Generator | ASCII text banners for terminal and README |
| Pixel Art | Draw pixel art on a grid with export |

---

## ◈ Features

- **⌘K Command Palette** — Fuzzy search across all tools
- **Floating Orb** — Ambient navigation beacon
- **Favorites** — Pin frequently used tools
- **Category Accordions** — Organized, collapsible sections
- **Custom Accent Colors** — 6 presets + custom HEX
- **Toast Notifications** — Bottom-center feedback
- **Prev/Next Navigation** — Floating side buttons
- **Tips & Use Cases** — Every tool has guidance
- **IndexedDB Persistence** — Settings & preferences saved locally
- **PWA** — Installable, works offline

---

## ◈ Getting Started

### Prerequisites

- **Node.js** 20 or later
- **npm** (comes with Node)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/niamhramadhaan/inztun.git
cd inztun

# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests
npm test

# Lint & format
npm run lint        # check for issues
npm run lint:fix    # auto-fix
npm run format      # format all files
```

---

## ◈ Deploy

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/niamhramadhaan/inztun)

Or deploy via CLI:

```bash
npx vercel
```

Vercel auto-detects the Vite framework. No configuration needed — `vercel.json` handles it.

---

## ◈ Tech Stack

| Technology | Purpose |
|------------|---------|
| TypeScript | Strict mode, zero frameworks |
| Vite | Build tool & dev server |
| Biome | Linting & formatting |
| CSS Custom Properties | Dynamic theming |
| IndexedDB | Client-side persistence |
| Web Crypto API | Secure hashing (SHA-256) |
| Canvas API | Cosmic background renderer |
| vite-plugin-pwa | Service worker, offline support |
| pdf-lib / pdfjs-dist | PDF manipulation |
| Vitest | Unit testing |

---

## ◈ Project Structure

```
src/
├── main.ts                  # App entry, module loader
├── core/                    # Router, EventBus, IndexedDB, Cosmos (canvas bg), icons
├── components/              # UI components (TopBar, BottomNav, CommandPalette, Toast, etc.)
├── modules/
│   ├── home/                # Dashboard with favorites, activity, quick actions
│   ├── workers-suite/       # 20 developer tools
│   ├── design-studio/       # 16 design tools
│   ├── marketing-lab/       # 8 marketing tools
│   ├── freelance-core/      # 9 business tools
│   └── playground/          # 3 creative tools
├── styles/                  # CSS (variables, base, grid, components)
├── types/                   # Shared TypeScript interfaces
└── utils/                   # Helpers (image, download-tracker)
```

Each tool lives in `src/modules/<module>/tools/<tool-name>.ts` and exports a `render(container: HTMLElement)` function.

---

## ◈ Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, code style, and PR guidelines.

Found a bug? [Open an issue](https://github.com/niamhramadhaan/inztun/issues). Want a feature? Same place.

---

## ◈ Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

---

## ◈ Roadmap

See [ROADMAP.md](./ROADMAP.md) for development phases.

---

## ◈ License

[Apache License 2.0](./LICENSE) — © 2026 inztun

---

<div align="center">

**Built with ✦ by [niamhramadhaan](https://github.com/niamhramadhaan)**

*The web, handmade.*

</div>

# Contributing to inztun

Thanks for your interest in contributing. Here's how to get started.

## Setup

```bash
git clone https://github.com/niamhramadhaan/inztun.git
cd inztun
npm install
npm run dev
```

## Development

- **TypeScript strict mode** — no `any`, proper types for everything
- **No frameworks** — vanilla TS, native Browser APIs
- **CSS Custom Properties** — no preprocessors, no Tailwind
- **One tool, one file** — each tool lives in `src/modules/<module>/tools/<tool-name>.ts`

## Adding a New Tool

1. Create `src/modules/<module>/tools/<tool-name>.ts`
2. Export a `render(container: HTMLElement)` function
3. Add tool metadata to the module's `tool-data.ts`
4. Register it in the module's `index.ts`
5. Add tests in `tools/__tests__/<tool-name>.test.ts`

## Code Style

- Keep it simple. No abstractions for abstraction's sake.
- Use `textContent` over `innerHTML` where possible.
- All data stays client-side — no network requests, no tracking.
  - **One exception:** `brand-extractor.ts` uses a public CORS proxy (`api.allorigins.win`) to fetch external URLs for analysis. This is the only outbound request in the app.
- Follow existing patterns. Look at neighboring files before writing new code.
- Run `npm run lint:fix` before committing to auto-fix style issues.

## Linting

```bash
npm run lint        # check for issues
npm run lint:fix    # auto-fix
npm run format      # format all files
```

## Testing

```bash
npm test            # run once
npm run test:watch  # watch mode
```

Write tests for tool logic (parsers, formatters, generators). UI rendering tests are optional.

## Commit Messages

- `feat: add <tool-name> to <module>`
- `fix: <description>`
- `docs: <description>`
- `refactor: <description>`

## Pull Requests

1. Fork the repo
2. Create a branch from `main`
3. Make your changes
4. Run `npm run lint`, `npm test`, and `npm run build`
5. Open a PR with a clear description of what you changed and why

## What We're Looking For

- New tools that fit existing modules
- Bug fixes
- Accessibility improvements
- Performance optimizations
- Better test coverage

## What We're NOT Looking For

- Framework migrations (React, Vue, etc.)
- Backend/API integrations
- Analytics or tracking code
- Heavy dependencies for things native APIs can do

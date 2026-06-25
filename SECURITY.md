# Security Policy

## Scope

inztun is a **100% client-side** application. There is no server, no database, no API keys, and no user accounts. All data stays in your browser's IndexedDB.

## Reporting a Vulnerability

If you find a security issue, please report it responsibly:

1. **Do NOT open a public issue**
2. Use [GitHub's private vulnerability reporting](https://github.com/niamhramadhaan/inztun/security/advisories/new)
3. Include: description, steps to reproduce, and potential impact

## What Counts as a Vulnerability

- Cross-site scripting (XSS) that could affect other users (note: since everything is local-only, self-XSS is low severity)
- Data leakage to external services
- Dependencies with known critical CVEs

## What Does NOT Count

- Self-XSS (you can only affect your own data)

## Response

We'll acknowledge reports within 72 hours and aim to ship a fix within 2 weeks for confirmed vulnerabilities.

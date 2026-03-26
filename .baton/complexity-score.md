# Complexity Score -- Phase 0: Project Scaffolding

> Generated: 2026-03-26 | Task: Phase 0 scaffolding for Askly

---

## Detected Stack

| Path | Stack | Evidence File |
|------|-------|---------------|
| / (root) | next (planned) | TRD.md Section 1.1 |
| / (root) | typescript (planned) | TRD.md Section 1.1 |
| / (root) | supabase (planned) | TRD.md Section 1.1 |
| / (root) | tailwindcss (planned) | TRD.md Section 1.1 |

> **Note:** No build files exist yet (greenfield project). Stack is confirmed from TRD.md.
> Once `package.json` is created in Phase 0, stack detection will use build files per R11.

## File -> Stack Mapping

| Extension | Stack | Directory |
|-----------|-------|-----------|
| .tsx | next / react | app/ |
| .ts | typescript | lib/, config files |
| .css | tailwindcss | app/ |
| .toml | supabase | supabase/ |
| .json | node | root (package.json, tsconfig.json) |

## Multi-Stack Status

- Multi-stack: NO (single Next.js fullstack application)
- API contract test required: NO

## Planned Files (Phase 0)

| # | File | Purpose |
|---|------|---------|
| 1 | package.json | Project manifest, dependencies |
| 2 | tsconfig.json | TypeScript configuration |
| 3 | next.config.ts | Next.js configuration |
| 4 | tailwind.config.ts | Tailwind CSS configuration |
| 5 | postcss.config.js | PostCSS configuration |
| 6 | .env.example | Environment variable template |
| 7 | app/layout.tsx | Root layout component |
| 8 | app/page.tsx | Home page placeholder |
| 9 | app/globals.css | Global styles (Tailwind directives) |
| 10 | lib/supabase/client.ts | Browser Supabase client |
| 11 | lib/supabase/server.ts | Server Supabase client |
| 12 | supabase/config.toml | Supabase local dev config |

## Dependencies (from task scope)

**Production:**
- next@14, react@18, react-dom@18
- @supabase/supabase-js, @supabase/ssr
- zustand, @tanstack/react-query
- tailwindcss, postcss, autoprefixer
- qrcode.react
- @anthropic-ai/sdk

**Dev:**
- typescript, @types/react, @types/node
- eslint, eslint-config-next

## Complexity Score

| Criterion | Applicable | Score |
|-----------|-----------|-------|
| Expected files to change (12 files, capped at 5) | YES | 5 |
| Cross-service dependency | NO | 0 |
| New feature (not modifying existing) | YES -- greenfield project | +2 |
| Includes architectural decisions | YES -- project structure, Supabase client pattern, config | +3 |
| Security / auth / payment related | NO -- placeholders only in Phase 0 | 0 |
| DB schema change | NO -- config only, no schema in Phase 0 | 0 |

### Total: 10 pts -> Tier 3

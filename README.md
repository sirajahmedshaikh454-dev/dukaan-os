# Dukaan OS

The operating system for small businesses in Pakistan.
One platform. Many mini-apps. One shared brain.

**Status:** Phase 0 (Foundation) is done: `v0.1.0-core`. Next: Phase 1, Khata.
Progress for supervisors: open [`progress/index.html`](progress/index.html) in any browser.

## What works today

- Sign up and log in with a Pakistani mobile number + password, in English or Urdu (RTL).
- A home screen built from mini-app **manifests**: nothing is listed by hand.
- Two demo mini-apps prove the core idea: **Hello** sends a `hello.pinged.v1` event, and
  **Counter** hears it and counts. They never import each other.
- Every shop's data is kept apart. One shop cannot read or change another shop's data.

## How it fits together

```
 Browser (apps/web)                         API (apps/api)                       MongoDB
 ┌────────────────────┐   /api/auth/*     ┌──────────────────────┐
 │ Shell: login, home │ ────────────────▶ │ auth (JWT + refresh) │ ──────────▶  users, tenants,
 │ grid from manifests│                   │                      │              refresh tokens
 │                    │   /api/apps/hello │ miniapps/hello ──┐   │
 │  Hello screen ─────┼─────────────────▶ │   publish        ▼   │
 │                    │                   │        event bus ────┼──────────▶  events (log)
 │  Counter screen ◀──┼─────────────────  │   subscribe      │   │
 │                    │ /api/apps/counter │ miniapps/counter ◀┘  │ ──────────▶  counter (per shop)
 └────────────────────┘                   └──────────────────────┘
```

- `packages/core`: event bus, `tenantModel` (tenant-scoped data), auth, shared Zod schemas.
- `packages/ui`: the "Warm bazaar" design system (tokens and base components).
- `miniapps/*`: one folder per mini-app, with a `manifest.ts`, an optional `server.ts` and a `web.tsx`.
- Decisions are recorded in [`docs/adr/`](docs/adr); events are listed in [`docs/EVENTS.md`](docs/EVENTS.md).

## Run it on your computer

You need Node 22+, pnpm 10, and MongoDB running on `127.0.0.1:27017`.

```bash
pnpm install
cp .env.example .env   # then set JWT_SECRET (the file says how)
pnpm --filter @dukaan/api dev    # API on http://localhost:4000
pnpm --filter @dukaan/web dev    # app on http://localhost:5173
```

## Tests

```bash
pnpm lint
pnpm typecheck   # if Windows blocks turbo.exe, use: pnpm -r typecheck
pnpm test        # if Windows blocks turbo.exe, use: pnpm -r test
pnpm e2e         # Playwright, uses your installed Chrome; MongoDB must be running
```

CI runs lint, typecheck and the unit + integration tests on every PR, and the E2E test on `main`.

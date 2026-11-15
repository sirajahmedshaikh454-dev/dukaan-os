# Dukaan OS — Phase 0 plan (Foundation)

## Context

Dukaan OS is a new project. The folder `Desktop\Dukaan OS` has only `CLAUDE.md` in it.
Phase 0 builds the skeleton that proves the architecture works, before any real mini-app.

**Phase 0 is done when:** a dummy mini-app loads from its manifest, events flow between two
dummy apps, CI is green, and an E2E smoke test passes.

Your answers, already decided:

- **GitHub:** public repo `dukaan-os` on your account.
- **Login:** phone number + password.
- **Event bus:** in-app bus, every event saved in a MongoDB `events` collection. No Redis yet.
- **Look:** "Warm bazaar" — paper-cream background, deep green + saffron accents.

What I found on your PC: Node 22, pnpm 10, git, gh (logged in), MongoDB 8 are installed.
Docker and Redis are **not** installed. That is fine for Phase 0.

## Choices I made for you (small ones)

| Choice                                                                                                                      | Why                                                     |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| TypeScript everywhere, strict mode                                                                                          | CLAUDE.md says "no `any`" and wants typecheck in CI     |
| ESLint + Prettier                                                                                                           | Standard, and lets us ban `any` and direct `Model.find` |
| Password hashing with Node's built-in `scrypt`                                                                              | No extra library, no Windows build problems             |
| `jose` for JWT                                                                                                              | Small, modern, no native code                           |
| Access token (15 min) kept in memory; refresh token in an httpOnly cookie, rotated on every use, only its hash stored in DB | Stolen JavaScript cannot read the refresh token         |
| Tailwind v4 with CSS-variable tokens                                                                                        | One place for colors/spacing, RTL-friendly              |
| Local `mongod` for dev, `mongodb-memory-server` for tests                                                                   | Atlas only needed at deploy (Phase 7)                   |

## Left out of Phase 0 on purpose

Not needed to meet the "done when" line. Each gets added in the phase that uses it:
`apps/worker` + BullMQ + Redis (Phase 4), Dexie/offline (Phase 3), Socket.io, GSAP, Three.js,
Framer Motion, `packages/ai-gateway` (Phase 1). Adding empty packages now is just noise.

## Layout after Phase 0

```
apps/web            React + Vite shell
apps/api            Express API
packages/core       event bus, tenant helper, auth helpers, shared Zod schemas + types
packages/ui         tokens + Button, Input, Card, AppTile, Empty/Loading/Error states
miniapps/hello      dummy app 1 — publishes hello.pinged.v1
miniapps/counter    dummy app 2 — consumes hello.pinged.v1, counts pings
e2e/                Playwright tests
progress/index.html progress tracker (single file)
docs/               PLAN.md, EVENTS.md, UX_NOTES.md, adr/
.github/workflows/  ci.yml
```

## How the key parts work

**Tenant scoping (`packages/core`)**

- Signup makes a `User` and a `Tenant` (the shop) and links them with a role.
- One helper, `forTenant(Model, tenantId)`, returns `find / findOne / create / update` that
  always add `tenantId`. Routes get `tenantId` from the JWT, never from the request body.
- ESLint rule bans calling `Model.find*` directly outside `packages/core`.

**Event bus (`packages/core`)**

- `defineEvent('hello.pinged.v1', zodSchema)` — name has a version, payload is checked by Zod.
- `publish(tenantId, event)`: validate → save to `events` collection (append-only) → call
  every subscriber in the same process.
- A failing subscriber is logged on the event document; it does not break the publisher.
- Code comment: `shortcut: no retry/queue, upgrade to BullMQ in Phase 4`.

**Mini-app loader**

- Each mini-app exports a manifest:
  `{ id, name, icon, routes, permissions, eventsPublished, eventsConsumed }`.
- Web shell finds them with `import.meta.glob('miniapps/*/src/manifest.ts')` — no list is
  hand-written. Home screen draws one tile per manifest; routes are lazy-loaded.
- API does the same: reads `miniapps/*` at start and calls each app's `register(router, bus)`.
- Mini-apps never import each other. An ESLint rule enforces it.

**API (`apps/api`)**

- Express, ESM. Every route validated with Zod. One central error handler.
- Routes: `POST /auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`,
  plus what the two dummy apps register.

**Web (`apps/web`)**

- Screens: Sign up, Log in, Home (app grid), dummy app pages.
- TanStack Query for server data, Zustand for the access token, react-hook-form + the same
  Zod schemas as the API.
- `react-i18next` with English + Urdu from day one; Urdu flips layout to RTL.
- Designed at 360px first. Empty, loading and error states are real components.

## Work order — one issue → one branch → one PR each

0. **Bootstrap (direct to `main`, the only time):** `git init`, create public repo `dukaan-os`,
   first commit with `CLAUDE.md`, `.gitignore`, `README` stub. Then protect `main` (CI must pass).
1. `chore/monorepo-ci` — pnpm workspaces, Turborepo, TS config, ESLint, Prettier, Vitest,
   GitHub Actions (lint + typecheck + unit + integration on every PR), `.env.example`,
   `progress/index.html` v1, `docs/PLAN.md`, ADR-0001 (monorepo).
2. `feat/core-tenant-events` — `forTenant` helper + event bus + unit tests,
   `docs/EVENTS.md`, ADR-0002 (tenancy), ADR-0003 (event bus).
3. `feat/api-auth` — Express app, error handler, auth routes. Integration tests for every
   route: happy path, bad login, bad input, wrong-tenant access. ADR-0004 (auth tokens).
4. `feat/ui-design-system` — tokens + base components + i18n/RTL setup.
   I will use the `ui-ux-pro-max` design skill here (there is no skill named
   `frontend-design` installed; this is the closest one).
5. `feat/web-shell` — login, signup, home grid, manifest loader.
6. `feat/dummy-miniapps` — `hello` + `counter`. Integration test: ping in `hello` →
   event saved → `counter` goes up, and another tenant's counter does **not** change.
7. `test/e2e-smoke` — Playwright: "New shopkeeper signs up, sees app tiles, opens Hello,
   taps Ping, opens Counter and sees 1." Runs at 360px width too. CI runs E2E on `main`.
8. `chore/phase-0-close` — I click through the app like a first-time shopkeeper, write
   `docs/UX_NOTES.md`, fix the top 3 problems, update README + progress page,
   tag `v0.1.0-core` with release notes.

After step 6 I will propose the `make-miniapp` project skill, because by then the pattern exists.

## Things I need from you later (not blocking now)

- **GitHub Projects board:** your `gh` login is missing the `project` permission. When we
  reach it, you run `gh auth refresh -s project` once. Until then I use issues + labels.

## How we check it works

- `pnpm lint && pnpm typecheck && pnpm test` — all green locally and in GitHub Actions.
- Integration tests prove: auth works, bad input is rejected, tenant A cannot see tenant B.
- `pnpm e2e` — the smoke story above passes on desktop and 360px.
- I run the app in the built-in browser and click through it myself; notes go in `docs/UX_NOTES.md`.
- `progress/index.html` opens by double-click and looks clean at phone width.

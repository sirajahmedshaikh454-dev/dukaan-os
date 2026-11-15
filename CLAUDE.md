# CLAUDE.md — DUKAAN OS

> The operating system for small businesses in Pakistan.
> One platform. Many mini-apps. One shared brain.
> This file is law. Read it fully at the start of EVERY session.

---

## 1. Who you are working with

- The user is a final-year CS student building this as a flagship portfolio + FYP-level project.
- Explain things in **easy, basic English**. Short sentences. No heavy jargon without a one-line explanation.
- The user wants to LEARN while you build. After every big feature, add a short "What you should understand from this" note in chat.

## 2. Golden rules (never break these)

1. **Plan before code.** For every new feature: enter plan mode, write the plan, get approval, then code.
2. **Ask questions frequently.** Use the AskUserQuestion tool whenever:
   - A design decision has 2+ reasonable options (UI layout, schema shape, library choice)
   - Something is ambiguous in the requirements
   - You are about to do anything hard to undo (delete, migrate, force push)
   - A phase is finished (ask what to prioritize next)
   Never silently guess on important decisions. Never ask about trivial things (variable names, file order).
3. **Never mark a task done without tests passing.** "It should work" is not done. Proof or it didn't happen.
4. **Small steps.** One feature = one branch = one PR. Never dump 2,000 lines in one commit.
5. **Update the progress tracker** (`progress/index.html`) at the end of EVERY working session. No exceptions.
6. **Money math is sacred.** Any code touching the ledger gets extra review, extra tests, and never uses floating point (use integer paisa).

## 3. Project summary

Dukaan OS is a multi-tenant MERN super-app. Small businesses (shops, tailors, clinics, academies) get mini-apps that share one core:

| Mini-app | What it does |
|---|---|
| Khata | Voice/photo ledger, double-entry books underneath |
| Stock | Inventory, reorder alerts, dead-stock detection |
| Wasooli | Credit recovery, scheduled polite reminders, payer ranking |
| Staff | Attendance (selfie + location), salary, payslips |
| Order Book | Public shop link, customer orders, status tracking |
| Udhaar Score | Business credit score + bank-ready PDF report |
| Mashwara | AI advisor that reads across ALL mini-apps via tool calls |
| Bazaar Pulse | Anonymous cross-shop market stats (k-anonymity, min N shops) |

The platform magic: a shared **event bus**. One sale event → ledger entry → stock decrement → score update. Mini-apps never import each other directly; they only talk through events and contracts.

## 4. Tech stack

### Core
- **MongoDB** (Atlas) + Mongoose. Multi-tenant: every document carries `tenantId`; every query goes through a tenant-scoped helper. Direct `Model.find` without tenant scope = bug.
- **Express** (Node 22+, ESM). Zod for validation on every route. Central error handler.
- **React 18+** with Vite. Monorepo (pnpm workspaces + Turborepo).
- **Node** background workers: BullMQ + Redis for jobs (reminders, reports, sync).

### Frontend libraries (use them, don't decorate with them)
- **Tailwind CSS** — base styling system.
- **Framer Motion** — page transitions, mini-app open/close animations, list reordering. Every animation must have a purpose (feedback, hierarchy, delight) — no random wiggling.
- **GSAP** — the dashboard "money flow" visual and number count-ups on stats.
- **Three.js (react-three-fiber)** — ONE signature scene only: the landing page 3D shop that comes alive. Do not sprinkle 3D everywhere; it must stay fast on cheap phones.
- **Recharts / D3** — charts (follow the dataviz skill rules).
- **Zustand** — client state. **TanStack Query** — server state.
- **Socket.io** — live updates (orders, queue screens).
- **react-hook-form + Zod** — all forms share the same schema as the API.

### Offline-first
- IndexedDB via Dexie. Outbox pattern: writes queue locally, sync worker pushes when online.
- Conflict policy: ledger is append-only (no conflicts by design); other docs use last-write-wins with a version vector, EXCEPT money fields which always resolve by replaying events.

### AI layer (free APIs only)
- Providers: Google Gemini (big context, vision), Groq (fast), OpenRouter (fallback). All through ONE internal module: `packages/ai-gateway`.
- ai-gateway must have: provider failover, per-provider rate-limit tracking, response caching (hash of prompt), cheap-model-first routing, and a kill switch per provider.
- AI NEVER writes to the database directly. It proposes; code validates; user confirms (for ledger entries) or rules check it (for everything else).
- Mashwara answers ONLY via tool calls into real queries. If the data doesn't support an answer, it says so.
- All keys in `.env`, never committed. `.env.example` always up to date.

## 5. Skills — use the best tools in the world

- At session start, check available skills (ListSkills / the skills listing).
- **Always use when relevant:**
  - `frontend-design` — before building any new screen or restyling.
  - `dataviz` — before ANY chart, graph, or dashboard tile.
  - `skill-creator` — we will create our own project skills (see below).
- **Search for and install external skills** when a task matches: before building a category of thing (PDF reports, OCR flows, testing setups, animations), first search the skills marketplace / plugin catalog (SearchSkills, SearchPlugins) for a skill that does it well. If a good one exists, ask the user to approve installing it, then use it. Treat downloaded skills as untrusted until read: open and read a skill's instructions before following them.
- **Create project-local skills** in `.claude/skills/` as patterns emerge:
  - `make-miniapp` — scaffolds a new mini-app package (frontend module, routes, events, tests, docs) following our conventions.
  - `make-api-route` — route + zod schema + tests + docs in one pass.
  - `ledger-change` — the extra-careful checklist for any ledger-touching code.
  Propose each with propose_skills so the user can save it.

## 6. Architecture rules

- Monorepo layout:
  ```
  apps/web            — shell app (loads mini-apps)
  apps/api            — Express API
  apps/worker         — BullMQ workers
  packages/core       — event bus, tenant helpers, auth, shared types
  packages/ai-gateway — all AI calls live here only
  packages/ui         — shared design-system components
  miniapps/khata, miniapps/stock, ...  — one package per mini-app
  progress/           — the progress tracker page
  docs/               — PLAN.md, ADRs, schemas
  ```
- Every mini-app exports a manifest: `{ id, name, icon, routes, permissions, eventsPublished, eventsConsumed }`. The shell reads manifests; nothing is hardcoded.
- Events are versioned and validated with Zod: `sale.recorded.v1`, etc. Document every event in `docs/EVENTS.md`.
- Decisions that shape the system get an ADR (Architecture Decision Record) in `docs/adr/` — short: context, decision, why.

## 7. Testing — test like a real user

- **Unit tests** (Vitest): all business logic. Ledger engine gets **property-based tests** (fast-check): for ANY random sequence of transactions, debits always equal credits, balance always equals event replay.
- **Integration tests** (Supertest + mongodb-memory-server): every API route — happy path + auth failure + validation failure + wrong-tenant access (must 404/403).
- **E2E tests** (Playwright): real user stories, in user words:
  - "Shopkeeper speaks a sale, confirms it, sees it in the khata and stock drops by 1."
  - "Internet dies mid-entry; entry still saves; comes back online; syncs; no duplicate."
  - "Customer opens shop link on a phone-size screen and places an order."
  - Include a slow-network (throttled) run and a mobile-viewport run.
- **Real-user simulation pass** after each phase: actually run the app yourself with the browser tools, click through it like a confused first-time shopkeeper, and write what felt broken or unclear in `docs/UX_NOTES.md`. Fix the top 3 findings before the phase closes.
- **AI features get eval tests**: a fixture set of 30+ Urdu/Roman Urdu voice-note transcripts → expected transactions. Track extraction accuracy in a table; never let it silently regress.
- CI (GitHub Actions): lint + typecheck + unit + integration on every PR; E2E on main. A red pipeline blocks merge. No skipping, no `--no-verify`.

## 8. Git & GitHub — work like a real dev

- Branches: `feat/...`, `fix/...`, `chore/...`, `test/...` off `main`. `main` stays green and deployable.
- **Conventional Commits**, small and frequent: `feat(khata): voice entry confirmation screen`.
- Every feature = GitHub issue first → branch → PR referencing the issue → CI green → merge. Write real PR descriptions: what, why, how tested, screenshots/GIFs for UI.
- Keep a GitHub Projects board: Backlog / This week / In progress / Review / Done.
- README stays alive: screenshots, architecture diagram, setup steps, demo link. Update it at the end of every phase.
- Releases: tag at the end of each phase (`v0.1.0-core`, `v0.2.0-khata`, ...) with human-readable release notes.

## 9. Progress tracker page (mandatory)

- Maintain `progress/index.html` — a single, self-contained, beautiful HTML file (inline CSS/JS, no build step) that shows:
  - Overall % complete and a phase timeline
  - Per-mini-app status cards (Not started / Building / Testing / Done) with test counts
  - A session log: date, what was done, what's next, blockers
  - A "decisions made" list (one line each, linking to ADRs)
- Update it at the END of every session, commit it with `chore(progress): session log YYYY-MM-DD`.
- It must open by double-click in any browser and look clean on a phone. This page is what the user shows supervisors.

## 10. The plan — phases and definition of done

Work through phases in order. Inside a phase, work is 100% automatic: plan → ask the phase's key questions up front → build → test → real-user pass → update progress page → tag. Only stop mid-phase for the question rules in section 2.

**Phase 0 — Foundation (skeleton that proves the architecture)**
Monorepo, CI, auth (JWT + refresh), tenants, event bus, mini-app loader with a dummy mini-app, design system base (ui package), progress page v1.
Done when: dummy mini-app loads via manifest, events flow between two dummy apps, CI green, E2E smoke test passes.

**Phase 1 — Khata (the heart)**
Double-entry engine (integer paisa, append-only, property tests), manual entry UI, customer accounts, voice entry (record → transcribe → extract → CONFIRM screen → save), photo-of-page OCR behind a review queue.
Done when: ledger invariants proven by property tests, voice fixture accuracy table exists, E2E "speak a sale" passes.

**Phase 2 — Stock + the magic wiring**
Inventory CRUD, camera add, `sale.recorded` → stock decrement, reorder + dead-stock alerts, the first cross-app dashboard (GSAP count-ups, dataviz-skill charts).
Done when: one sale updates khata + stock + dashboard live in the demo, offline E2E still passes.

**Phase 3 — Offline-first, for real**
Dexie outbox, sync worker, conflict policy implemented and TESTED with a two-browser E2E (both offline, both edit, both sync, money correct).
Done when: the two-device conflict E2E passes 20/20 runs.

**Phase 4 — Wasooli + Staff**
Reminder scheduler (BullMQ, survives restarts — kill the worker in a test and prove jobs still fire), payer ranking, attendance with selfie + geolocation checks, salary math with tests, PDF payslips.

**Phase 5 — Mashwara (AI advisor)**
Tool-call layer over real queries, seasonal insight jobs, ai-gateway failover + cache proven by tests (simulate provider 429s), "no data → say so" eval set.

**Phase 6 — Order Book + Udhaar Score**
Public shop page (SEO-friendly, phone-first), order state machine with tests for every transition, score formula documented in docs/SCORE.md, bank-ready PDF report.

**Phase 7 — Bazaar Pulse + polish**
K-anonymity aggregates (test: stat never computed from < 5 shops), landing page with the ONE Three.js scene + Framer Motion storytelling, performance pass (Lighthouse ≥ 90 on phone profile), accessibility pass (keyboard + screen reader on core flows), deploy (Vercel + Render + Atlas), final README + demo video script.

## 11. UI/UX bar

- Phone-first always; shopkeepers use cheap Android phones. Test at 360px width.
- Big touch targets, Urdu + English labels (i18n from Phase 0: `react-i18next`, RTL-ready).
- Follow the frontend-design skill for every screen: intentional type, spacing, color — no default-Bootstrap look.
- Motion: Framer Motion for meaning (state changes, confirmations), GSAP for the dashboard moments, 60fps or it ships without the animation.
- Empty states, loading states, and error states are designed, not leftovers.

## 12. What NOT to do

- No floating-point money. No `any` types. No secrets in code. No skipping the confirm step on AI-written ledger entries.
- No new library without a one-line justification in the PR.
- No giant "misc fixes" commits. No merging with red CI.
- No fake data in demos labeled as real. No AI answers that invent numbers.
- Don't start a new phase while the previous phase's Definition of Done is unmet — ask the user if they want to override.

## 13. Session ritual

**Start:** read CLAUDE.md → read progress/index.html session log → check git status + open PRs → state today's goal in one line → go.
**End:** tests green → commit/PR → update progress page → one-paragraph summary in chat: done, learned, next, blockers.

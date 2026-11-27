---
name: make-miniapp
description: Scaffold a new Dukaan OS mini-app package (manifest, server routes, web screen, events, integration tests, docs) the way miniapps/hello and miniapps/counter are built. Use this whenever the user wants to add, start, create or scaffold a mini-app, or to begin building any of Khata, Stock, Wasooli, Staff, Order Book, Udhaar Score, Mashwara or Bazaar Pulse, even if they only say "start the khata app" or "add a new module/feature app to the home screen". Do not use it to change an existing mini-app.
---

# make-miniapp

A mini-app is one folder in `miniapps/`. The web shell and the API find it on their own from its
`manifest.ts`, so adding a mini-app never means editing the shell's code. Your job is to add that folder
plus the pieces around it (events, tests, docs) so the new app is wired, safe and proven.

**The living examples are the source of truth.** Read these before writing anything, and copy their
shape. They are small:

- `miniapps/hello/` publishes an event (manifest, server route, screen).
- `miniapps/counter/` consumes an event, stores per-shop data, and shows loading/error states.
- `apps/api/src/miniapps.test.ts` is the integration-test pattern.
- `packages/core/src/contracts.ts` holds the event definitions. `docs/EVENTS.md` lists them.

## Before you write: settle the design

CLAUDE.md says to plan first and ask when there are real options. For a mini-app, settle these up
front, in plan mode for anything bigger than a demo:

1. **id**: lowercase, like `khata` or `order-book`. It must match `^[a-z][a-z0-9-]*$` and becomes the
   folder name, the package name `@dukaan/miniapp-<id>`, and the URL `/api/apps/<id>`.
2. **Name in English and Urdu**: `name: { en, ur }`. Ask the user for the Urdu name if you are not sure.
   A wrong Urdu word on a shopkeeper's home screen is worse than asking.
3. **Icon**: a lucide icon name in kebab-case (e.g. `book-open`, `package`). Check that it exists:
   from `apps/web`, run
   `node -e "import('lucide-react/dynamic').then(m => console.log(m.iconNames.includes('<name>')))"`.
   A wrong name fails the type check in `HomePage` and shows an empty tile.
4. **Events**: which events it publishes and which it consumes. Every one must already exist in
   `contracts.ts`, or you add it there (see below).
5. **Does it need a server?** `server.ts` is optional. A screen-only app just has no `server.ts`.

## Files to create

```
miniapps/<id>/
  package.json     copy from counter; change "name" to @dukaan/miniapp-<id>; keep only the deps you use
  tsconfig.json    copy from counter unchanged
  src/manifest.ts  export const manifest: Manifest = { id, name: {en, ur}, icon, routes, permissions,
                   eventsPublished, eventsConsumed }
  src/server.ts    export function register({ router, bus, session }: MiniappServerContext)  (optional)
  src/web.tsx      export default function <Name>Screen({ api, lang }: MiniappScreenProps)
```

Then run `pnpm install` so the workspace links the new package.

### server.ts rules (these protect shop data)

- **Get `tenantId` only from `session(res).tenantId`.** Never from the body, query or URL. The token
  was verified; the body is whatever the client sent.
- **Store data only with `tenantModel` from `@dukaan/core/server`**, then `.for(tenantId)`. ESLint
  blocks importing `mongoose` here on purpose (ADR-0002).
- **Prefix model names with the mini-app id** (e.g. `KhataEntry`, not `Entry`). Mongoose model names
  are global, so a clash throws at startup.
- **Validate every request body with Zod** (`schema.parse(req.body ?? {})`). The central error
  handler turns a `ZodError` into a 400 with the field list, so do not catch it yourself.
- Routes are mounted at `/api/apps/<id>` and already sit behind login, so do not add auth yourself.
- **The bus is scoped.** Publishing or subscribing to an event not listed in the manifest throws.
  Update the manifest first.
- Give each subscribe a short handler id (`'onSale'`). The bus prefixes it with the app id, so
  failures logged on the event say which app broke.
- **Make handlers safe to run twice.** Use atomic updates (`$inc`, upserts) or check whether the work
  is already done. Delivery moves to BullMQ with retries in Phase 4, and retries repeat handlers.
- Never import another mini-app. Talk through events in `contracts.ts` only (ESLint enforces this).
- **Money is integer paisa, never floats** (CLAUDE.md rule 6). If the app touches the ledger, stop and
  follow the extra-careful ledger checklist, including property tests.

### web.tsx rules

- Call the server only through the `api` prop. It is already limited to `/api/apps/<id>`, so pass
  paths like `'/'` or `'/ping'`.
- Put every string in a `text = { en: {...}, ur: {...} }` object and pick `text[lang]`, like Hello
  and Counter do. Mini-apps do not touch the shell's i18n files.
- Build from `@dukaan/ui`: `Button`, `Card`, `Input`, `LoadingState`, `EmptyState`, `ErrorState`.
  Loading, empty and error states are designed screens, not leftovers.
- Use token classes (`bg-primary`, `text-muted`, `text-danger`), never raw hex colours. Keep touch
  targets 48px or more (`min-h-12`). Use logical/RTL-safe layout, because Urdu flips the page.
- For server data use TanStack Query (`useQuery`) like Counter, and add
  `@tanstack/react-query` to the package's dependencies.
- Add a `data-testid` only where an E2E test needs a stable hook.
- For a new screen or restyle, follow the design skill (`ui-ux-pro-max`) as CLAUDE.md asks.

## New events

For each new event:

1. Add it to `packages/core/src/contracts.ts` under the events comment:
   `export const thingHappened = defineEvent('thing.happened.v1', z.object({...}))`.
   The name must be versioned (`.v1`). A breaking payload change means a new `.v2`, never an edit.
   Money fields are `z.number().int()` paisa.
2. Add a row to the table in `docs/EVENTS.md`: event, published by, consumed by, payload.
3. List it in the manifest's `eventsPublished` / `eventsConsumed`.

## Tests

Add `apps/api/src/<id>.test.ts`, copying the setup from `miniapps.test.ts` (`await createApp(...)`,
`startTestDb`, a `newShop` helper that signs up and returns the bearer token and tenantId). CLAUDE.md
section 7 asks for these cases on every route:

- **Happy path**: the route does its job, and any event lands in `listEvents(tenantId, name)`.
- **Auth failure**: no token gives 401.
- **Validation failure**: a bad body gives 400 and changes nothing.
- **Wrong tenant**: shop B cannot see or change shop A's data. Assert the 404, or that B gets its own
  empty result.
- **Cross-app effect**: if the app consumes an event, publish it through the real route of the app
  that owns it and assert the effect, like the Hello → Counter test.

Pure logic (calculations, parsers, state machines) gets plain Vitest unit tests next to the code, and
property tests (fast-check) for anything touching money.

## Prove it

Run these and read the output. Do not report done on "it should work" (CLAUDE.md rule 3):

```bash
pnpm lint
pnpm -r typecheck   # `pnpm typecheck` uses turbo, which Windows Application Control blocks on this PC
pnpm -r test
pnpm e2e            # the smoke test must still pass now that the home grid has one more tile
```

Then open the app in the browser pane at 360px, in English and Urdu, and check: the tile shows with
its icon, the screen opens, the loading and error states look designed, and nothing scrolls sideways.

## Ship it

Follow the git flow in CLAUDE.md section 8: issue → `feat/<id>-<short>` branch → Conventional
Commits (`feat(<id>): ...`) → PR. The PR says what, why, how it was tested, and gives a one-line reason
for any new library. Update `progress/index.html` (the app's status card and its test count).

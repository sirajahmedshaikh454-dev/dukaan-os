# ADR-0001: One monorepo with pnpm workspaces + Turborepo

**Context.** Dukaan OS has a web shell, an API, shared packages and many mini-apps. They share
types and Zod schemas (the same schema checks a form in the browser and the request in the API).

**Decision.** One git repo. pnpm workspaces link the packages. Turborepo runs `typecheck` and
`test` per package. Internal packages are used as TypeScript source (`exports` points at
`src/index.ts`), so there is no build step for them.

**Why.** One PR can change the API and the UI together, so shared schemas never drift. No build
step for internal packages means less config and faster feedback. Trade-off: every app that
uses a package must be able to compile TypeScript (Vite, tsx and Vitest all can).

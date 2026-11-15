# ADR-0002: Tenant scoping through `tenantModel`

**Context.** Many shops share one database. The worst possible bug is one shop seeing another
shop's money. A rule like "always remember to add `tenantId`" will be forgotten one day.

**Decision.** Tenant-owned collections are defined with `tenantModel(name, fields)` in
`packages/core`. It adds a required, indexed `tenantId` and returns only `.for(tenantId)`,
which gives `find / findOne / count / create / update`. The raw Mongoose model is never
exported. An ESLint rule bans importing `mongoose` outside `packages/core`.

**Why.** The unsafe query cannot be written, so it cannot be forgotten. `tenantId` is applied
last in every filter, so a caller cannot override it, and an update that mentions `tenantId`
throws. Trade-off: only a small set of operations exists; we add more when a feature needs one.

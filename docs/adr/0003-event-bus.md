# ADR-0003: In-process event bus with a MongoDB event log

**Context.** One sale must update the ledger, the stock and the score, but mini-apps must not
import each other. The dev machine has no Redis or Docker.

**Decision.** `createBus()` in `packages/core` validates an event with Zod, saves it to the
`events` collection, then calls each subscriber inside the same Node process. Subscriber
errors are recorded on the event document and do not reach the publisher.

**Why.** No extra infrastructure in Phase 0, and the saved log lets us replay events later
(the rule for money fields). Known limit: no retry, and a crash between "saved" and
"delivered" loses the delivery (not the event). Phase 4 moves delivery to BullMQ + Redis,
reading from the same log.

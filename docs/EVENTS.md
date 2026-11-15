# Events

Mini-apps never import each other. They talk only through events on the shared bus
(`packages/core/src/events.ts`).

## Rules

- Names are versioned: `thing.happened.v1`. A breaking payload change means a new version (`v2`).
- Every event has a Zod schema. A payload that fails the schema is rejected and **not** saved.
- Every published event is saved in the MongoDB `events` collection with its `tenantId`.
  Name, tenant and payload are never changed after saving.
- If a subscriber throws, the error is recorded on the event (`failures`) and the other
  subscribers still run. The publisher does not fail.

## Event list

| Event                                                       | Published by | Consumed by | Payload |
| ----------------------------------------------------------- | ------------ | ----------- | ------- |
| _none yet — the first ones arrive with the dummy mini-apps_ |              |             |         |

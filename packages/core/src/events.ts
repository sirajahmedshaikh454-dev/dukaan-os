import mongoose, { Schema } from 'mongoose';
import type { z } from 'zod';
import { eventNameSchema } from './manifest';

// The event log. Name, tenant and payload are written once and never changed.
const EventModel = mongoose.model(
  'Event',
  new Schema(
    {
      tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
      name: { type: String, required: true, index: true },
      payload: { type: Schema.Types.Mixed, required: true },
      failures: [{ handler: String, error: String }],
    },
    { timestamps: { createdAt: true, updatedAt: false } },
  ),
);

export interface EventDef<P> {
  name: string;
  schema: z.ZodType<P>;
}

export function defineEvent<P>(name: string, schema: z.ZodType<P>): EventDef<P> {
  eventNameSchema.parse(name);
  return { name, schema };
}

export interface BusEvent<P> {
  eventId: string;
  tenantId: string;
  payload: P;
}

type Handler<P> = (event: BusEvent<P>) => Promise<void> | void;

export function createBus() {
  const subscribers = new Map<string, { id: string; fn: Handler<unknown> }[]>();

  return {
    /** `id` names the handler (e.g. "counter.onPing") so failures can be traced. */
    subscribe<P>(def: EventDef<P>, id: string, fn: Handler<P>) {
      const list = subscribers.get(def.name) ?? [];
      list.push({ id, fn: fn as Handler<unknown> });
      subscribers.set(def.name, list);
    },

    /** Validate, save to the event log, then tell every subscriber. Returns the event id. */
    async publish<P>(tenantId: string, def: EventDef<P>, payload: P): Promise<string> {
      const data = def.schema.parse(payload);
      const saved = await EventModel.create({ tenantId, name: def.name, payload: data });
      const eventId = String(saved._id);

      // shortcut: handlers run in-process with no retry, upgrade to BullMQ in Phase 4.
      for (const { id, fn } of subscribers.get(def.name) ?? []) {
        try {
          await fn({ eventId, tenantId, payload: data });
        } catch (err) {
          // One broken mini-app must not break the publisher or the other subscribers.
          await EventModel.updateOne(
            { _id: saved._id },
            { $push: { failures: { handler: id, error: String(err) } } },
          );
        }
      }
      return eventId;
    },
  };
}

export type Bus = ReturnType<typeof createBus>;

/** Read the saved events of one tenant, oldest first (for tests, debugging and replay). */
export function listEvents(tenantId: string, name?: string) {
  return EventModel.find(name ? { tenantId, name } : { tenantId })
    .sort({ _id: 1 })
    .lean<{ name: string; payload: unknown; failures: { handler: string; error: string }[] }[]>()
    .exec();
}

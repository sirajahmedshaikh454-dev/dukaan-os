import { z } from 'zod';
import { eventNameSchema } from './manifest';

// Contracts: the only things mini-apps share. A mini-app never imports another
// mini-app; it imports an event definition from here and uses the bus.

export interface EventDef<P> {
  name: string;
  schema: z.ZodType<P>;
}

export function defineEvent<P>(name: string, schema: z.ZodType<P>): EventDef<P> {
  eventNameSchema.parse(name);
  return { name, schema };
}

/** What the shell gives to every mini-app screen. */
export interface MiniappScreenProps {
  /** Calls this mini-app's own API routes only (/api/apps/<id>/...). */
  api: <T>(path: string, options?: { method?: string; body?: unknown }) => Promise<T>;
  lang: 'en' | 'ur';
}

// ---- Events (keep docs/EVENTS.md in sync) ----

export const helloPinged = defineEvent('hello.pinged.v1', z.object({ note: z.string().max(100) }));

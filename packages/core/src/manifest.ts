import { z } from 'zod';

// Event names are versioned: "sale.recorded.v1"
export const eventNameSchema = z.string().regex(/^[a-z]+(\.[a-z-]+)+\.v\d+$/);

// Every mini-app exports one of these. The shell reads manifests; nothing is hardcoded.
export const manifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  // Shown on the home screen in English and Urdu.
  name: z.object({ en: z.string().min(1), ur: z.string().min(1) }),
  icon: z.string().min(1),
  routes: z.array(z.object({ path: z.string().startsWith('/') })).min(1),
  permissions: z.array(z.string()),
  eventsPublished: z.array(eventNameSchema),
  eventsConsumed: z.array(eventNameSchema),
});

export type Manifest = z.infer<typeof manifestSchema>;

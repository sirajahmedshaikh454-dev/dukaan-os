import { helloPinged } from '@dukaan/core';
import type { MiniappServerContext } from '@dukaan/core/server';
import { z } from 'zod';

const pingBody = z.object({ note: z.string().trim().min(1).max(100).default('Salam') });

export function register({ router, bus, session }: MiniappServerContext) {
  // Hello knows nothing about Counter. It only announces that a ping happened.
  router.post('/ping', async (req, res) => {
    const { note } = pingBody.parse(req.body ?? {});
    const eventId = await bus.publish(session(res).tenantId, helloPinged, { note });
    res.status(201).json({ eventId });
  });
}

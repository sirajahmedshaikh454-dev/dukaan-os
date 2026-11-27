import { helloPinged } from '@dukaan/core';
import { tenantModel, type MiniappServerContext } from '@dukaan/core/server';

const Counters = tenantModel<{ pings: number }>('CounterPings', {
  pings: { type: Number, default: 0 },
});

export function register({ router, bus, session }: MiniappServerContext) {
  // Counter knows nothing about Hello. It only reacts to the event.
  bus.subscribe(helloPinged, 'onPing', async ({ tenantId }) => {
    // $inc is atomic: two pings at the same moment still count as two.
    await Counters.for(tenantId).update({}, { $inc: { pings: 1 } }, { upsert: true });
  });

  router.get('/', async (_req, res) => {
    const doc = await Counters.for(session(res).tenantId).findOne();
    res.json({ pings: doc?.pings ?? 0 });
  });
}

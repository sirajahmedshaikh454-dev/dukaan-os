import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineEvent } from './contracts';
import { createBus, listEvents } from './events';
import { newId, startTestDb } from './testing';

const pinged = defineEvent('test.pinged.v1', z.object({ note: z.string() }));

let stop: () => Promise<void>;
beforeAll(async () => {
  stop = await startTestDb();
}, 120_000);
afterAll(() => stop());

describe('event bus', () => {
  it('refuses an event name without a version', () => {
    expect(() => defineEvent('test.pinged', z.object({}))).toThrow();
  });

  it('saves the event and delivers it to subscribers', async () => {
    const bus = createBus();
    const shop = newId();
    const seen: string[] = [];
    bus.subscribe(pinged, 'test.collect', (e) => void seen.push(`${e.tenantId}:${e.payload.note}`));

    await bus.publish(shop, pinged, { note: 'salam' });

    expect(seen).toEqual([`${shop}:salam`]);
    const saved = await listEvents(shop);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ name: 'test.pinged.v1', payload: { note: 'salam' } });
  });

  it('rejects a bad payload and saves nothing', async () => {
    const bus = createBus();
    const shop = newId();
    // @ts-expect-error — wrong payload type on purpose
    await expect(bus.publish(shop, pinged, { note: 42 })).rejects.toThrow();
    expect(await listEvents(shop)).toEqual([]);
  });

  it('a failing subscriber is logged and does not stop the others', async () => {
    const bus = createBus();
    const shop = newId();
    let secondRan = false;
    bus.subscribe(pinged, 'test.broken', () => {
      throw new Error('boom');
    });
    bus.subscribe(pinged, 'test.healthy', () => void (secondRan = true));

    await expect(bus.publish(shop, pinged, { note: 'x' })).resolves.toBeTypeOf('string');

    expect(secondRan).toBe(true);
    const [event] = await listEvents(shop);
    expect(event?.failures).toMatchObject([{ handler: 'test.broken', error: 'Error: boom' }]);
  });
});

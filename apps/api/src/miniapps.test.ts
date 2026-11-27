import { listEvents } from '@dukaan/core/server';
import { startTestDb } from '@dukaan/core/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';

const app = await createApp({ jwtSecret: 'test-secret-that-is-at-least-32-chars' });

async function newShop(phone: string, shopName: string) {
  const signup = await request(app)
    .post('/api/auth/signup')
    .send({ phone, password: 'test-password', shopName });
  const token = signup.body.accessToken as string;
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  return { bearer: `Bearer ${token}`, tenantId: me.body.tenant.id as string };
}

const pings = async (bearer: string) =>
  (await request(app).get('/api/apps/counter').set('Authorization', bearer)).body.pings as number;

let stop: () => Promise<void>;
let ali: Awaited<ReturnType<typeof newShop>>;
let sara: Awaited<ReturnType<typeof newShop>>;
beforeAll(async () => {
  stop = await startTestDb();
  ali = await newShop('03001230001', 'Ali Kiryana');
  sara = await newShop('03001230002', 'Sara Tailors');
}, 120_000);
afterAll(() => stop());

describe('dummy mini-apps talk only through the event bus', () => {
  it('a ping in Hello raises the count in Counter for the same shop only', async () => {
    expect(await pings(ali.bearer)).toBe(0);

    const ping = await request(app).post('/api/apps/hello/ping').set('Authorization', ali.bearer);
    expect(ping.status).toBe(201);
    await request(app).post('/api/apps/hello/ping').set('Authorization', ali.bearer);

    expect(await pings(ali.bearer)).toBe(2);
    expect(await pings(sara.bearer)).toBe(0); // wrong tenant sees nothing
  });

  it('every ping is saved in the event log of the right shop', async () => {
    const saved = await listEvents(ali.tenantId, 'hello.pinged.v1');
    expect(saved).toHaveLength(2);
    expect(saved[0]).toMatchObject({ payload: { note: 'Salam' }, failures: [] });
    expect(await listEvents(sara.tenantId)).toEqual([]);
  });

  it('mini-app routes need a login', async () => {
    expect((await request(app).post('/api/apps/hello/ping')).status).toBe(401);
    expect((await request(app).get('/api/apps/counter')).status).toBe(401);
  });

  it('rejects a bad ping body and counts nothing', async () => {
    const res = await request(app)
      .post('/api/apps/hello/ping')
      .set('Authorization', sara.bearer)
      .send({ note: 123 });
    expect(res.status).toBe(400);
    expect(await pings(sara.bearer)).toBe(0);
  });

  it('an unknown mini-app is a 404', async () => {
    const res = await request(app).get('/api/apps/nope').set('Authorization', ali.bearer);
    expect(res.status).toBe(404);
  });
});

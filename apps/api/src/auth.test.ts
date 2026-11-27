import { startTestDb } from '@dukaan/core/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';

const app = await createApp({ jwtSecret: 'test-secret-that-is-at-least-32-chars' });
const ali = { phone: '0300 1234567', password: 'ali-ka-password', shopName: 'Ali Kiryana' };
const sara = { phone: '03111234567', password: 'sara-ka-password', shopName: 'Sara Tailors' };

const refreshCookie = (res: request.Response) => {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((c) => c.startsWith('refresh_token=')) ?? '';
};

let stop: () => Promise<void>;
beforeAll(async () => {
  stop = await startTestDb();
}, 120_000);
afterAll(() => stop());

describe('POST /api/auth/signup', () => {
  it('creates a shop and logs the owner in', async () => {
    const res = await request(app).post('/api/auth/signup').send(ali);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(refreshCookie(res)).toMatch(/HttpOnly/i);
    expect(refreshCookie(res)).toMatch(/SameSite=Strict/i);
  });

  it('refuses a phone number that already has an account', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...ali, phone: '+923001234567' }); // same number, written differently
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('phone_taken');
  });

  it('rejects bad input and says which fields are wrong', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ phone: '12345', password: 'short', shopName: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.map((f: { path: string }) => f.path).sort()).toEqual([
      'password',
      'phone',
      'shopName',
    ]);
  });

  it('answers broken JSON with 400, not 500', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: ali.phone, password: ali.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
  });

  it('gives the same 401 for a wrong password and an unknown phone', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ phone: ali.phone, password: 'ghalat-password' });
    const unknownPhone = await request(app)
      .post('/api/auth/login')
      .send({ phone: '03459999999', password: ali.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownPhone.status).toBe(401);
    expect(unknownPhone.body).toEqual(wrongPassword.body);
  });

  it('rejects bad input', async () => {
    const res = await request(app).post('/api/auth/login').send({ phone: 'abc' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('needs a token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const forged = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.token');
    expect(forged.status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const other = await createApp({ jwtSecret: 'another-secret-that-is-32-chars-long' });
    const login = await request(other)
      .post('/api/auth/login')
      .send({ phone: ali.phone, password: ali.password });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(401);
  });

  it('each user sees only their own shop', async () => {
    const saraSignup = await request(app).post('/api/auth/signup').send(sara);
    const aliLogin = await request(app)
      .post('/api/auth/login')
      .send({ phone: ali.phone, password: ali.password });

    const saraMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${saraSignup.body.accessToken}`);
    const aliMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${aliLogin.body.accessToken}`);

    expect(saraMe.body).toMatchObject({ phone: '+923111234567', tenant: { name: 'Sara Tailors' } });
    expect(aliMe.body).toMatchObject({ phone: '+923001234567', tenant: { name: 'Ali Kiryana' } });
    expect(aliMe.body.tenant.id).not.toBe(saraMe.body.tenant.id);
    expect(JSON.stringify(aliMe.body)).not.toContain('passwordHash');
  });
});

describe('POST /api/auth/refresh and /logout', () => {
  it('needs the refresh cookie', async () => {
    expect((await request(app).post('/api/auth/refresh')).status).toBe(401);
  });

  it('gives a new token, and the old refresh cookie stops working', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ phone: ali.phone, password: ali.password });
    const oldCookie = refreshCookie(login);

    const first = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    expect(first.status).toBe(200);
    expect(first.body.accessToken).toBeTypeOf('string');

    const replay = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    expect(replay.status).toBe(401);
  });

  it('logout kills the refresh cookie', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ phone: ali.phone, password: ali.password });
    const cookie = refreshCookie(login);

    expect((await request(app).post('/api/auth/logout').set('Cookie', cookie)).status).toBe(204);
    expect((await request(app).post('/api/auth/refresh').set('Cookie', cookie)).status).toBe(401);
  });
});

describe('unknown routes', () => {
  it('answer 404 as JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});

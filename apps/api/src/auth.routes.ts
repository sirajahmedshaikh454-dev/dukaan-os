import { AppError, loginSchema, signupSchema } from '@dukaan/core';
import { REFRESH_TTL_MS, type Auth } from '@dukaan/core/server';
import { Router, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth, session } from './middleware';

const COOKIE = 'refresh_token';
const cookieOptions = {
  httpOnly: true, // JavaScript in the page cannot read it
  sameSite: 'strict', // other websites cannot send it
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
} as const;

function sendTokens(
  res: Response,
  status: number,
  tokens: { accessToken: string; refreshToken: string },
) {
  res
    .cookie(COOKIE, tokens.refreshToken, { ...cookieOptions, maxAge: REFRESH_TTL_MS })
    .status(status)
    .json({ accessToken: tokens.accessToken });
}

const refreshCookie = (req: Request): unknown => req.cookies[COOKIE];

export function authRoutes(auth: Auth) {
  const router = Router();
  // Slows down password guessing: 30 tries per 15 minutes per IP.
  const limiter = rateLimit({ windowMs: 15 * 60_000, limit: 30 });

  router.post('/signup', limiter, async (req, res) => {
    sendTokens(res, 201, await auth.signup(signupSchema.parse(req.body)));
  });

  router.post('/login', limiter, async (req, res) => {
    sendTokens(res, 200, await auth.login(loginSchema.parse(req.body)));
  });

  router.post('/refresh', async (req, res) => {
    const token = refreshCookie(req);
    if (typeof token !== 'string') throw new AppError(401, 'unauthorized', 'Please log in again');
    sendTokens(res, 200, await auth.refresh(token));
  });

  router.post('/logout', async (req, res) => {
    const token = refreshCookie(req);
    if (typeof token === 'string') await auth.logout(token);
    res.clearCookie(COOKIE, cookieOptions).status(204).end();
  });

  router.get('/me', requireAuth(auth), async (_req, res) => {
    res.json(await auth.me(session(res)));
  });

  return router;
}

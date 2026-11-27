import { AppError } from '@dukaan/core';
import { createAuth, createBus } from '@dukaan/core/server';
import cookieParser from 'cookie-parser';
import express from 'express';
import { authRoutes } from './auth.routes';
import { errorHandler } from './middleware';
import { loadMiniapps } from './miniapps';

export async function createApp({ jwtSecret }: { jwtSecret: string }) {
  const auth = createAuth(jwtSecret);
  const bus = createBus();
  const app = express();

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/auth', authRoutes(auth));
  await loadMiniapps(app, auth, bus);

  app.use(() => {
    throw new AppError(404, 'not_found', 'Not found');
  });
  app.use(errorHandler);
  return app;
}

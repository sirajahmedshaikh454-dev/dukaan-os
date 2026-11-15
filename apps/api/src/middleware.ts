import { AppError } from '@dukaan/core';
import type { Auth, Session } from '@dukaan/core/server';
import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

/** Checks the "Authorization: Bearer <token>" header and remembers who is calling. */
export const requireAuth =
  (auth: Auth): RequestHandler =>
  async (req, res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError(401, 'unauthorized', 'Please log in');
    res.locals.session = await auth.verify(token);
    next();
  };

/** tenantId always comes from here (the verified token), never from the request body. */
export const session = (res: Response) => res.locals.session as Session;

/** The one place where errors become HTTP responses. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  void _next;
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'invalid_input',
        message: 'Please check the form',
        fields: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // Body-parser errors (broken JSON, body too large) carry their own 4xx status.
  const status = (err as { status?: number }).status;
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ error: { code: 'bad_request', message: 'Bad request' } });
    return;
  }
  console.error(err); // details stay in the server log, never in the response
  res.status(500).json({ error: { code: 'server_error', message: 'Something went wrong' } });
};

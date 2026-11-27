// Server-only code (needs Node + MongoDB). The browser must import '@dukaan/core' instead.
import type { Response, Router } from 'express';
import mongoose from 'mongoose';
import type { Session } from './auth';
import type { Bus } from './events';

export * from './index';
export * from './tenant';
export * from './events';
export * from './auth';

export const connectDb = (uri: string) => mongoose.connect(uri);
export const disconnectDb = () => mongoose.disconnect();

/** What the API gives to the server code of a mini-app when it starts. */
export interface MiniappServerContext {
  /** Mounted at /api/apps/<id>, already behind login. */
  router: Router;
  /** Only the events named in the manifest are allowed on this bus. */
  bus: Bus;
  /** Who is calling. tenantId comes from the verified token. */
  session: (res: Response) => Session;
}

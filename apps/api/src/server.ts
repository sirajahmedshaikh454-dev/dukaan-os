import { connectDb } from '@dukaan/core/server';
import { z } from 'zod';
import { createApp } from './app';

// Fail at startup, with a clear message, if the .env file is wrong.
const env = z
  .object({
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    PORT: z.coerce.number().default(4000),
  })
  .parse(process.env);

await connectDb(env.MONGODB_URI);
createApp({ jwtSecret: env.JWT_SECRET }).listen(env.PORT, () => {
  console.log(`API ready on http://localhost:${env.PORT}`);
});

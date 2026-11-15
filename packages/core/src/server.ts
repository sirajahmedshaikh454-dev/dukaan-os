// Server-only code (needs Node + MongoDB). The browser must import '@dukaan/core' instead.
import mongoose from 'mongoose';

export * from './index';
export * from './tenant';
export * from './events';
export * from './auth';

export const connectDb = (uri: string) => mongoose.connect(uri);
export const disconnectDb = () => mongoose.disconnect();

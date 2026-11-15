import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

/** Starts a throw-away MongoDB for tests. Call the returned function to stop it. */
export async function startTestDb() {
  const server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri());
  return async () => {
    await mongoose.disconnect();
    await server.stop();
  };
}

export const newId = () => String(new mongoose.Types.ObjectId());

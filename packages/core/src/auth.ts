import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import mongoose, { Schema } from 'mongoose';
import { AppError } from './errors';
import type { LoginInput, SignupInput } from './schemas';

export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ACCESS_TTL = '15m';

const Tenant = mongoose.model('Tenant', new Schema({ name: { type: String, required: true } }));

const User = mongoose.model(
  'User',
  new Schema({
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    tenantId: { type: Schema.Types.ObjectId, required: true },
  }),
);

const RefreshToken = mongoose.model(
  'RefreshToken',
  new Schema({
    userId: { type: Schema.Types.ObjectId, required: true },
    // Only the hash is stored: a leaked database cannot be used to log in.
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 }, // MongoDB deletes it after this time
  }),
);

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

const derive = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  );

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${(await derive(password, salt)).toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  return timingSafeEqual(
    await derive(password, Buffer.from(salt, 'hex')),
    Buffer.from(hash, 'hex'),
  );
}

export interface Session {
  userId: string;
  tenantId: string;
}

const badLogin = () => new AppError(401, 'bad_credentials', 'Wrong phone number or password');
const badSession = () => new AppError(401, 'unauthorized', 'Please log in again');

export function createAuth(jwtSecret: string) {
  const key = new TextEncoder().encode(jwtSecret);

  async function issueTokens(user: {
    _id: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
  }) {
    const accessToken = await new SignJWT({ tid: String(user.tenantId) })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(user._id))
      .setExpirationTime(ACCESS_TTL)
      .sign(key);
    const refreshToken = randomBytes(32).toString('base64url');
    await RefreshToken.create({
      userId: user._id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return { accessToken, refreshToken };
  }

  return {
    /** Creates the shop (tenant) and its owner in one step. */
    async signup({ phone, password, shopName }: SignupInput) {
      const taken = () =>
        new AppError(409, 'phone_taken', 'This phone number already has an account');
      if (await User.exists({ phone })) throw taken();
      const tenant = await Tenant.create({ name: shopName });
      try {
        const user = await User.create({
          phone,
          passwordHash: await hashPassword(password),
          tenantId: tenant._id,
        });
        return await issueTokens(user);
      } catch (err) {
        await Tenant.deleteOne({ _id: tenant._id }); // do not leave a shop with no owner
        // 11000 = duplicate key: two signups with the same phone at the same moment
        if ((err as { code?: number }).code === 11000) throw taken();
        throw err;
      }
    },

    async login({ phone, password }: LoginInput) {
      const user = await User.findOne({ phone });
      // Same error for "no such phone" and "wrong password": do not reveal which one.
      if (!user || !(await verifyPassword(password, user.passwordHash))) throw badLogin();
      return issueTokens(user);
    },

    /** Rotation: the old refresh token is deleted, so each one works exactly once. */
    async refresh(refreshToken: string) {
      const row = await RefreshToken.findOneAndDelete({
        tokenHash: sha256(refreshToken),
        expiresAt: { $gt: new Date() },
      });
      const user = row && (await User.findById(row.userId));
      if (!user) throw badSession();
      return issueTokens(user);
    },

    async logout(refreshToken: string) {
      await RefreshToken.deleteOne({ tokenHash: sha256(refreshToken) });
    },

    async verify(accessToken: string): Promise<Session> {
      try {
        const { payload } = await jwtVerify(accessToken, key, { algorithms: ['HS256'] });
        if (!payload.sub || typeof payload.tid !== 'string') throw badSession();
        return { userId: payload.sub, tenantId: payload.tid };
      } catch {
        throw badSession();
      }
    },

    async me({ userId, tenantId }: Session) {
      const [user, tenant] = await Promise.all([User.findById(userId), Tenant.findById(tenantId)]);
      if (!user || !tenant) throw badSession();
      return {
        id: String(user._id),
        phone: user.phone,
        tenant: { id: String(tenant._id), name: tenant.name },
      };
    },
  };
}

export type Auth = ReturnType<typeof createAuth>;

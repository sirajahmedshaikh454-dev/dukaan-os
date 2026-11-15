import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './auth';
import { phoneSchema } from './schemas';

describe('phoneSchema', () => {
  it.each(['03001234567', '+923001234567', '0300-1234567', '0300 123 4567'])(
    'turns %s into +923001234567',
    (input) => expect(phoneSchema.parse(input)).toBe('+923001234567'),
  );

  it.each(['', '12345', '04001234567', '030012345678', '+913001234567', 'abc'])(
    'rejects %s',
    (input) => expect(phoneSchema.safeParse(input).success).toBe(false),
  );
});

describe('password hashing', () => {
  it('accepts the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('sahi-password');
    expect(stored).not.toContain('sahi-password');
    expect(await verifyPassword('sahi-password', stored)).toBe(true);
    expect(await verifyPassword('ghalat-password', stored)).toBe(false);
  });

  it('gives a different hash each time (random salt)', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });
});

import { describe, expect, it } from 'vitest';
import { manifestSchema } from './manifest';

const valid = {
  id: 'hello',
  name: { en: 'Hello', ur: 'سلام' },
  icon: 'hand',
  routes: [{ path: '/' }],
  permissions: [],
  eventsPublished: ['hello.pinged.v1'],
  eventsConsumed: [],
};

describe('manifestSchema', () => {
  it('accepts a valid manifest', () => {
    expect(manifestSchema.parse(valid)).toEqual(valid);
  });

  it('rejects an event name without a version', () => {
    expect(manifestSchema.safeParse({ ...valid, eventsPublished: ['hello.pinged'] }).success).toBe(
      false,
    );
  });

  it('rejects a mini-app with no routes', () => {
    expect(manifestSchema.safeParse({ ...valid, routes: [] }).success).toBe(false);
  });
});

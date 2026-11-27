import type { Manifest } from '@dukaan/core';

export const manifest: Manifest = {
  id: 'hello',
  name: { en: 'Hello', ur: 'سلام' },
  icon: 'hand',
  routes: [{ path: '/' }],
  permissions: [],
  eventsPublished: ['hello.pinged.v1'],
  eventsConsumed: [],
};

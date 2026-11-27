import type { Manifest } from '@dukaan/core';

export const manifest: Manifest = {
  id: 'counter',
  name: { en: 'Counter', ur: 'کاؤنٹر' },
  icon: 'hash',
  routes: [{ path: '/' }],
  permissions: [],
  eventsPublished: [],
  eventsConsumed: ['hello.pinged.v1'],
};

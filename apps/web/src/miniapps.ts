import { manifestSchema, type MiniappScreenProps } from '@dukaan/core';
import { lazy, type ComponentType } from 'react';

// The shell never lists mini-apps by hand. Adding a folder under miniapps/ with a
// manifest.ts (and a web.tsx screen) is enough for it to show up here.
const manifests = import.meta.glob<{ manifest: unknown }>('../../../miniapps/*/src/manifest.ts', {
  eager: true,
});
const screens = import.meta.glob<{ default: ComponentType<MiniappScreenProps> }>(
  '../../../miniapps/*/src/web.tsx',
);

export const miniapps = Object.entries(manifests).map(([path, mod]) => {
  const manifest = manifestSchema.parse(mod.manifest); // a broken manifest fails loudly at startup
  const load = screens[path.replace('manifest.ts', 'web.tsx')];
  // lazy: the code of a mini-app is downloaded only when the user opens it
  return { manifest, Screen: load ? lazy(load) : null };
});

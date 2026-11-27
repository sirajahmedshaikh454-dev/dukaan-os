import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { manifestSchema, type Manifest } from '@dukaan/core';
import type { Auth, Bus, MiniappServerContext } from '@dukaan/core/server';
import { Router, type Express } from 'express';
import { requireAuth, session } from './middleware';

const MINIAPPS_DIR = new URL('../../../miniapps/', import.meta.url);

/** A bus that only allows the events a mini-app declared in its manifest. */
function scopedBus(bus: Bus, manifest: Manifest): Bus {
  return {
    publish(tenantId, def, payload) {
      if (!manifest.eventsPublished.includes(def.name)) {
        throw new Error(`${manifest.id} did not declare ${def.name} in eventsPublished`);
      }
      return bus.publish(tenantId, def, payload);
    },
    subscribe(def, id, fn) {
      if (!manifest.eventsConsumed.includes(def.name)) {
        throw new Error(`${manifest.id} did not declare ${def.name} in eventsConsumed`);
      }
      bus.subscribe(def, `${manifest.id}.${id}`, fn);
    },
  };
}

/**
 * Finds every folder in miniapps/, checks its manifest and mounts its routes at
 * /api/apps/<id>, behind login. Nothing is listed by hand.
 */
export async function loadMiniapps(app: Express, auth: Auth, bus: Bus) {
  const loaded: string[] = [];
  for (const entry of await readdir(MINIAPPS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const src = new URL(`${entry.name}/src/`, MINIAPPS_DIR);
    const serverFile = new URL('server.ts', src);
    if (!existsSync(serverFile)) continue; // a mini-app may be web-only

    const manifestModule = (await import(new URL('manifest.ts', src).href)) as {
      manifest: unknown;
    };
    const manifest = manifestSchema.parse(manifestModule.manifest);
    const serverModule = (await import(serverFile.href)) as {
      register: (ctx: MiniappServerContext) => void;
    };

    const router = Router();
    serverModule.register({ router, bus: scopedBus(bus, manifest), session });
    app.use(`/api/apps/${manifest.id}`, requireAuth(auth), router);
    loaded.push(manifest.id);
  }
  return loaded;
}

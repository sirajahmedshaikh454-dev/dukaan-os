import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { tenantModel } from './tenant';
import { newId, startTestDb } from './testing';

const Notes = tenantModel<{ text: string }>('TestNote', { text: String });
const shopA = newId();
const shopB = newId();

let stop: () => Promise<void>;
beforeAll(async () => {
  stop = await startTestDb();
}, 120_000);
afterAll(() => stop());

describe('tenantModel', () => {
  it('one shop cannot see another shop’s documents', async () => {
    const note = await Notes.for(shopA).create({ text: 'secret of A' });

    expect(await Notes.for(shopA).count()).toBe(1);
    expect(await Notes.for(shopB).find()).toEqual([]);
    expect(await Notes.for(shopB).findOne({ _id: note._id })).toBeNull();
  });

  it('a filter cannot override the tenant scope', async () => {
    expect(await Notes.for(shopB).find({ tenantId: shopA })).toEqual([]);
  });

  it('one shop cannot update another shop’s document', async () => {
    const note = await Notes.for(shopA).create({ text: 'original' });
    const result = await Notes.for(shopB).update({ _id: note._id }, { $set: { text: 'hacked' } });

    expect(result).toBeNull();
    expect((await Notes.for(shopA).findOne({ _id: note._id }))?.text).toBe('original');
  });

  it('an update cannot move a document to another tenant', () => {
    expect(() => Notes.for(shopA).update({}, { $set: { tenantId: shopB } })).toThrow();
  });
});

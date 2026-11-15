import mongoose, { Schema, type SchemaDefinition } from 'mongoose';

type Filter = Record<string, unknown>;

export type TenantDoc<T> = T & {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
};

// An update must never move a document to another tenant.
function assertNoTenantChange(update: Filter): Filter {
  if (JSON.stringify(update).includes('"tenantId"')) {
    throw new Error('tenantId cannot be changed by an update');
  }
  return update;
}

/**
 * Defines a collection where every document belongs to one tenant (one shop).
 * The raw Mongoose model never leaves this file: callers must go through
 * `.for(tenantId)`, so a query without tenant scope cannot be written.
 */
export function tenantModel<T extends object>(name: string, definition: SchemaDefinition) {
  const schema = new Schema(
    { ...definition, tenantId: { type: Schema.Types.ObjectId, required: true, index: true } },
    { timestamps: true },
  );
  const model = mongoose.model(name, schema);

  return {
    for(tenantId: string) {
      // tenantId goes last so a caller's filter can never override it.
      const scope = (filter: Filter = {}) => ({ ...filter, tenantId });
      return {
        find: (filter?: Filter) => model.find(scope(filter)).lean<TenantDoc<T>[]>().exec(),
        findOne: (filter?: Filter) =>
          model.findOne(scope(filter)).lean<TenantDoc<T> | null>().exec(),
        count: (filter?: Filter) => model.countDocuments(scope(filter)).exec(),
        create: async (doc: T) =>
          (await model.create({ ...doc, tenantId })).toObject() as TenantDoc<T>,
        update: (filter: Filter, update: Filter, options: { upsert?: boolean } = {}) =>
          model
            .findOneAndUpdate(scope(filter), assertNoTenantChange(update), {
              ...options,
              returnDocument: 'after',
            })
            .lean<TenantDoc<T> | null>()
            .exec(),
      };
    },
  };
}

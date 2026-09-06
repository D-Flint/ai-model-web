import { createHash } from 'node:crypto';
import { verifiedApiPricing } from '../src/data/apiPricing';
import { apiPricingSchema } from '../src/lib/apiPricingSchema';
import { apiPricingTiers } from '../src/db/schema/index';
import { connectDatabase } from '../src/db/client';

const rows = Object.entries(verifiedApiPricing).flatMap(([slug, value]) => {
  const record = apiPricingSchema.parse(value);
  return record.tiers.map((tier) => ({
    id: createHash('sha256')
      .update(JSON.stringify([slug, record.scope, tier, record.notes]))
      .digest('hex'),
    modelSlug: slug,
    provider: record.provider,
    scope: record.scope,
    tierId: tier.id,
    minContext: tier.minContext,
    maxContext: tier.maxContext,
    rates: tier,
    notes: record.notes,
  }));
});
if (process.argv.includes('--dry-run')) {
  console.log(
    `Validated ${rows.length} pricing tiers for ${Object.keys(verifiedApiPricing).length} models; no database writes.`,
  );
} else {
  const connection = connectDatabase();
  try {
    await connection.db
      .insert(apiPricingTiers)
      .values(rows)
      .onConflictDoNothing();
    console.log(
      `Persisted ${rows.length} reviewed pricing tiers without overwriting history.`,
    );
  } finally {
    await connection.close();
  }
}

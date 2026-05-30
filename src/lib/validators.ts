// ArcGov — arcgov.vercel.app
// Validator data-access layer.
//
// WHY THIS FILE EXISTS:
// Pages should not care *where* validator data comes from. Today it comes from
// a static JSON file (`src/data/validators.json`). Tomorrow it might come from
// a live indexer/API. By routing every page through the functions below, you
// can swap the source in ONE place (see `getValidators`) without touching any
// page. That is the whole point of a "data-access layer".

import validatorsJson from '@/data/validators.json';
import type { Validator } from '@/types';
import { getBlocksValidatedByAddress } from '@/lib/validator-stats';

// The JSON is our current source of truth. We assert its type once, here.
const STATIC_VALIDATORS = validatorsJson as Validator[];

/**
 * Returns every validator.
 *
 * TO GO LIVE LATER: replace the line below with a real fetch, e.g.
 *   const res = await fetch('https://your-indexer/api/validators');
 *   return (await res.json()) as Validator[];
 * Everything else in the app keeps working unchanged.
 */
export async function getValidators(): Promise<Validator[]> {
  return STATIC_VALIDATORS;
}

/** Returns a single validator by its numeric id, or null if not found. */
export async function getValidatorById(id: string | number): Promise<Validator | null> {
  const all = await getValidators();
  return all.find((v) => v.id.toString() === id.toString()) ?? null;
}

/**
 * A validator address is a "placeholder" until Arc/Circle publishes the real
 * node addresses. Placeholders all start with 0x1000..., so live on-chain
 * numbers (like blocks produced) will correctly read as 0 / "—" for them.
 */
export function isPlaceholderAddress(address?: string): boolean {
  return !address || address.startsWith('0x1000');
}

/**
 * Fetches the live "blocks validated" count for every validator from the Arc
 * block explorer, keyed by validator id. Placeholders resolve to 0 honestly
 * (we never invent a number). Network failures resolve to 0, not a crash.
 */
export async function getBlockCounts(): Promise<Record<number, number>> {
  const all = await getValidators();
  const counts = await Promise.all(
    all.map((v) =>
      isPlaceholderAddress(v.validatorAddress)
        ? Promise.resolve(0)
        : getBlocksValidatedByAddress(v.validatorAddress).catch(() => 0)
    )
  );

  const map: Record<number, number> = {};
  all.forEach((v, i) => {
    map[v.id] = counts[i];
  });
  return map;
}

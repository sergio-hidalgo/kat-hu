/**
 * The type filter on `/drops` (spec 05d), as pure functions so it is tested
 * without a DOM, like `rankPosts`. The page script narrows the *recent* block
 * with it after the featured set has been chosen from every drop.
 */
import { DROP_TYPES, isDropType, type DropType } from '@kat-hu/contracts';

/** The filter's value: one type, or every drop. */
export type DropFilter = DropType | 'all';

export interface Typed {
  dropType: DropType;
}

/** An unknown or missing value is `all`, so a stale link never hides everything. */
export function parseTypeParam(value: string | null | undefined): DropFilter {
  return isDropType(value) ? value : 'all';
}

/** Keeps the order it was given — the recent block is already by date. */
export function filterByType<T extends Typed>(items: T[], filter: DropFilter): T[] {
  return filter === 'all' ? items : items.filter((item) => item.dropType === filter);
}

/**
 * The types a reader can choose between, in the contract's order: only those
 * with at least one drop, and none at all when fewer than two exist — there is
 * nothing to choose between.
 */
export function offeredTypes<T extends Typed>(items: T[]): DropType[] {
  const present = DROP_TYPES.filter((type) => items.some((item) => item.dropType === type));
  return present.length < 2 ? [] : present;
}

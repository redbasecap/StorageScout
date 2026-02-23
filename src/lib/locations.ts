import type { Item } from './types';

export type LocationSummary = {
  name: string;
  itemCount: number;
  boxIds: string[];
};

/**
 * Extract unique locations from items with counts and associated boxes.
 * Sorted by item count descending.
 */
export function getLocationSummaries(items: Item[]): LocationSummary[] {
  const map = new Map<string, { count: number; boxIds: Set<string> }>();

  for (const item of items) {
    const loc = item.location?.trim();
    if (!loc) continue;

    const existing = map.get(loc);
    if (existing) {
      existing.count++;
      existing.boxIds.add(item.boxId);
    } else {
      map.set(loc, { count: 1, boxIds: new Set([item.boxId]) });
    }
  }

  return Array.from(map.entries())
    .map(([name, { count, boxIds }]) => ({
      name,
      itemCount: count,
      boxIds: Array.from(boxIds),
    }))
    .sort((a, b) => b.itemCount - a.itemCount);
}

/**
 * Get all unique location names from items, sorted alphabetically.
 */
export function getUniqueLocations(items: Item[]): string[] {
  const locations = new Set<string>();
  for (const item of items) {
    const loc = item.location?.trim();
    if (loc) locations.add(loc);
  }
  return Array.from(locations).sort((a, b) => a.localeCompare(b));
}

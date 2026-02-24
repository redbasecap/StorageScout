import type { Item } from './types';

/**
 * Group items by a key function. Returns a Map preserving insertion order.
 */
export function groupItemsBy<K extends string>(
  items: Item[],
  keyFn: (item: Item) => K
): Map<K, Item[]> {
  const map = new Map<K, Item[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key);
    if (existing) {
      existing.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

/**
 * Get items added within the last N days.
 */
export function getRecentItems(items: Item[], days: number): Item[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const ts = item.createdAt?.toDate?.();
    return ts && ts.getTime() > cutoff;
  });
}

/**
 * Get tag frequency map from items, sorted by frequency descending.
 */
export function getTagFrequencies(items: Item[]): { tag: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const item of items) {
    if (item.tags) {
      for (const tag of item.tags) {
        freq.set(tag, (freq.get(tag) || 0) + 1);
      }
    }
  }
  return Array.from(freq.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Deduplicate items by id (keeps first occurrence).
 */
export function deduplicateItems(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

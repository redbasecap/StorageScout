import type { Item } from './types';

export type BoxStats = {
  totalItems: number;
  uniqueLocations: string[];
  allTags: string[];
  tagCounts: Record<string, number>;
  oldestItem: Date | null;
  newestItem: Date | null;
  itemsWithImages: number;
  itemsWithoutImages: number;
};

/**
 * Calculate statistics for items within a single box.
 */
export function calculateBoxStats(items: Item[]): BoxStats {
  if (items.length === 0) {
    return {
      totalItems: 0,
      uniqueLocations: [],
      allTags: [],
      tagCounts: {},
      oldestItem: null,
      newestItem: null,
      itemsWithImages: 0,
      itemsWithoutImages: 0,
    };
  }

  const locations = new Set<string>();
  const tagCounts: Record<string, number> = {};
  let oldest: Date | null = null;
  let newest: Date | null = null;
  let withImages = 0;
  let withoutImages = 0;

  for (const item of items) {
    if (item.location) locations.add(item.location);

    if (item.tags) {
      for (const tag of item.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const date = item.createdAt?.toDate?.();
    if (date) {
      if (!oldest || date < oldest) oldest = date;
      if (!newest || date > newest) newest = date;
    }

    if (item.imageUrl && !item.imageUrl.includes('placeholder')) {
      withImages++;
    } else {
      withoutImages++;
    }
  }

  const allTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

  return {
    totalItems: items.length,
    uniqueLocations: [...locations].sort(),
    allTags,
    tagCounts,
    oldestItem: oldest,
    newestItem: newest,
    itemsWithImages: withImages,
    itemsWithoutImages: withoutImages,
  };
}

/**
 * Calculate global inventory statistics across all items.
 */
export function calculateInventoryStats(items: Item[]): {
  totalItems: number;
  totalBoxes: number;
  totalLocations: number;
  totalTags: number;
  topTags: Array<{ tag: string; count: number }>;
  itemsPerBox: Array<{ boxId: string; count: number }>;
} {
  const boxes = new Set<string>();
  const locations = new Set<string>();
  const tagCounts: Record<string, number> = {};

  const boxCounts: Record<string, number> = {};

  for (const item of items) {
    boxes.add(item.boxId);
    if (item.location) locations.add(item.location);
    boxCounts[item.boxId] = (boxCounts[item.boxId] || 0) + 1;

    if (item.tags) {
      for (const tag of item.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const itemsPerBox = Object.entries(boxCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([boxId, count]) => ({ boxId, count }));

  return {
    totalItems: items.length,
    totalBoxes: boxes.size,
    totalLocations: locations.size,
    totalTags: Object.keys(tagCounts).length,
    topTags,
    itemsPerBox,
  };
}

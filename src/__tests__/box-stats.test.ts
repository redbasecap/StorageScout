import { describe, it, expect } from 'vitest';
import { calculateBoxStats, calculateInventoryStats } from '@/lib/box-stats';
import type { Item } from '@/lib/types';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    name: 'Test Item',
    description: 'A test',
    boxId: 'box-1',
    location: 'Garage',
    imageUrl: '',
    userId: 'user-1',
    createdAt: { toDate: () => new Date('2024-06-15') } as any,
    tags: [],
    ...overrides,
  };
}

describe('calculateBoxStats', () => {
  it('returns zeroed stats for empty array', () => {
    const stats = calculateBoxStats([]);
    expect(stats.totalItems).toBe(0);
    expect(stats.uniqueLocations).toEqual([]);
    expect(stats.allTags).toEqual([]);
    expect(stats.oldestItem).toBeNull();
    expect(stats.newestItem).toBeNull();
  });

  it('counts items and locations', () => {
    const items = [
      makeItem({ location: 'Garage' }),
      makeItem({ id: 'item-2', location: 'Attic' }),
      makeItem({ id: 'item-3', location: 'Garage' }),
    ];
    const stats = calculateBoxStats(items);
    expect(stats.totalItems).toBe(3);
    expect(stats.uniqueLocations).toEqual(['Attic', 'Garage']);
  });

  it('counts tags with frequency', () => {
    const items = [
      makeItem({ tags: ['tools', 'metal'] }),
      makeItem({ id: 'item-2', tags: ['tools', 'plastic'] }),
    ];
    const stats = calculateBoxStats(items);
    expect(stats.tagCounts).toEqual({ tools: 2, metal: 1, plastic: 1 });
    expect(stats.allTags[0]).toBe('tools'); // sorted by frequency
  });

  it('tracks oldest and newest items', () => {
    const items = [
      makeItem({ createdAt: { toDate: () => new Date('2024-01-01') } as any }),
      makeItem({ id: 'i2', createdAt: { toDate: () => new Date('2024-12-31') } as any }),
      makeItem({ id: 'i3', createdAt: { toDate: () => new Date('2024-06-15') } as any }),
    ];
    const stats = calculateBoxStats(items);
    expect(stats.oldestItem?.toISOString()).toContain('2024-01-01');
    expect(stats.newestItem?.toISOString()).toContain('2024-12-31');
  });

  it('counts items with and without images', () => {
    const items = [
      makeItem({ imageUrl: 'https://firebasestorage.googleapis.com/photo.jpg' }),
      makeItem({ id: 'i2', imageUrl: '' }),
      makeItem({ id: 'i3', imageUrl: 'https://placeholder.com/placeholder.jpg' }),
    ];
    const stats = calculateBoxStats(items);
    expect(stats.itemsWithImages).toBe(1);
    expect(stats.itemsWithoutImages).toBe(2);
  });
});

describe('calculateInventoryStats', () => {
  it('calculates global stats across boxes', () => {
    const items = [
      makeItem({ boxId: 'box-1', location: 'Garage', tags: ['a'] }),
      makeItem({ id: 'i2', boxId: 'box-1', location: 'Garage', tags: ['a', 'b'] }),
      makeItem({ id: 'i3', boxId: 'box-2', location: 'Attic', tags: ['c'] }),
    ];
    const stats = calculateInventoryStats(items);
    expect(stats.totalItems).toBe(3);
    expect(stats.totalBoxes).toBe(2);
    expect(stats.totalLocations).toBe(2);
    expect(stats.totalTags).toBe(3);
    expect(stats.topTags[0]).toEqual({ tag: 'a', count: 2 });
    expect(stats.itemsPerBox).toHaveLength(2);
    expect(stats.itemsPerBox[0]).toEqual({ boxId: 'box-1', count: 2 });
  });

  it('handles empty items', () => {
    const stats = calculateInventoryStats([]);
    expect(stats.totalItems).toBe(0);
    expect(stats.totalBoxes).toBe(0);
    expect(stats.topTags).toEqual([]);
  });

  it('limits topTags to 10', () => {
    const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`);
    const items = tags.map((tag, i) =>
      makeItem({ id: `i${i}`, tags: [tag] })
    );
    const stats = calculateInventoryStats(items);
    expect(stats.topTags.length).toBeLessThanOrEqual(10);
  });
});

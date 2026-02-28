import { describe, it, expect } from 'vitest';
import { sortItems, filterItems } from '@/lib/sort-filter';
import type { Item } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';

const makeTimestamp = (ms: number): Timestamp => ({ toMillis: () => ms, toDate: () => new Date(ms) } as Timestamp);

const makeItem = (overrides: Partial<Item> & { id: string; name: string }): Item => ({
  description: '',
  boxId: 'box-1',
  location: '',
  imageUrl: '',
  userId: 'user-1',
  createdAt: makeTimestamp(0),
  ...overrides,
});

describe('sortItems edge cases', () => {
  it('handles empty array', () => {
    expect(sortItems([], 'name', 'asc')).toEqual([]);
  });

  it('handles items with missing locations gracefully', () => {
    const items = [
      makeItem({ id: '1', name: 'A', location: '' }),
      makeItem({ id: '2', name: 'B', location: 'Garage' }),
    ];
    const sorted = sortItems(items, 'location', 'asc');
    expect(sorted[0].id).toBe('1'); // empty string sorts first
  });

  it('is stable for equal items', () => {
    const items = [
      makeItem({ id: '1', name: 'Same', createdAt: makeTimestamp(1000) }),
      makeItem({ id: '2', name: 'Same', createdAt: makeTimestamp(1000) }),
    ];
    const sorted = sortItems(items, 'name', 'asc');
    expect(sorted[0].id).toBe('1');
    expect(sorted[1].id).toBe('2');
  });
});

describe('filterItems edge cases', () => {
  it('returns all items for empty filter', () => {
    const items = [makeItem({ id: '1', name: 'Foo' })];
    expect(filterItems(items, '')).toEqual(items);
    expect(filterItems(items, '   ')).toEqual(items);
  });

  it('is case-insensitive', () => {
    const items = [makeItem({ id: '1', name: 'LAPTOP' })];
    expect(filterItems(items, 'laptop')).toHaveLength(1);
  });

  it('matches tags', () => {
    const items = [makeItem({ id: '1', name: 'Widget', tags: ['electronics', 'fragile'] })];
    expect(filterItems(items, 'fragile')).toHaveLength(1);
    expect(filterItems(items, 'food')).toHaveLength(0);
  });

  it('handles items with no tags', () => {
    const items = [makeItem({ id: '1', name: 'Widget' })];
    expect(filterItems(items, 'anything')).toHaveLength(0);
  });

  it('matches partial description', () => {
    const items = [makeItem({ id: '1', name: 'Box', description: 'Contains old books' })];
    expect(filterItems(items, 'book')).toHaveLength(1);
  });
});

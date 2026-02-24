import { describe, it, expect } from 'vitest';
import { groupItemsBy, getTagFrequencies, deduplicateItems } from '@/lib/item-utils';
import type { Item } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

function makeItem(overrides: Partial<Item> & { id: string }): Item {
  return {
    name: 'Test',
    description: '',
    boxId: 'box-1',
    location: '',
    imageUrl: '',
    userId: 'u1',
    createdAt: Timestamp.now(),
    ...overrides,
  };
}

describe('groupItemsBy', () => {
  it('groups items by boxId', () => {
    const items = [
      makeItem({ id: '1', boxId: 'a' }),
      makeItem({ id: '2', boxId: 'b' }),
      makeItem({ id: '3', boxId: 'a' }),
    ];
    const grouped = groupItemsBy(items, (i) => i.boxId);
    expect(grouped.get('a')?.length).toBe(2);
    expect(grouped.get('b')?.length).toBe(1);
  });

  it('groups items by location', () => {
    const items = [
      makeItem({ id: '1', location: 'Garage' }),
      makeItem({ id: '2', location: 'Attic' }),
      makeItem({ id: '3', location: 'Garage' }),
      makeItem({ id: '4', location: 'Attic' }),
      makeItem({ id: '5', location: 'Attic' }),
    ];
    const grouped = groupItemsBy(items, (i) => i.location);
    expect(grouped.get('Garage')?.length).toBe(2);
    expect(grouped.get('Attic')?.length).toBe(3);
  });

  it('returns empty map for empty input', () => {
    const grouped = groupItemsBy([], (i) => i.boxId);
    expect(grouped.size).toBe(0);
  });
});

describe('getTagFrequencies', () => {
  it('counts tag frequencies and sorts descending', () => {
    const items = [
      makeItem({ id: '1', tags: ['electronics', 'fragile'] }),
      makeItem({ id: '2', tags: ['electronics'] }),
      makeItem({ id: '3', tags: ['books', 'fragile'] }),
      makeItem({ id: '4', tags: ['books'] }),
      makeItem({ id: '5', tags: ['electronics'] }),
    ];
    const freq = getTagFrequencies(items);
    expect(freq[0]).toEqual({ tag: 'electronics', count: 3 });
    expect(freq[1]).toEqual({ tag: 'fragile', count: 2 });
    expect(freq[2]).toEqual({ tag: 'books', count: 2 });
  });

  it('handles items with no tags', () => {
    const items = [
      makeItem({ id: '1' }),
      makeItem({ id: '2', tags: ['a'] }),
    ];
    const freq = getTagFrequencies(items);
    expect(freq).toEqual([{ tag: 'a', count: 1 }]);
  });

  it('returns empty array for no tags at all', () => {
    const items = [makeItem({ id: '1' }), makeItem({ id: '2' })];
    expect(getTagFrequencies(items)).toEqual([]);
  });
});

describe('deduplicateItems', () => {
  it('removes duplicate items by id', () => {
    const item1 = makeItem({ id: '1', name: 'First' });
    const item1dup = makeItem({ id: '1', name: 'Duplicate' });
    const item2 = makeItem({ id: '2', name: 'Second' });
    const result = deduplicateItems([item1, item1dup, item2]);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('First');
    expect(result[1].name).toBe('Second');
  });

  it('handles empty array', () => {
    expect(deduplicateItems([])).toEqual([]);
  });

  it('handles all unique items', () => {
    const items = [makeItem({ id: '1' }), makeItem({ id: '2' }), makeItem({ id: '3' })];
    expect(deduplicateItems(items).length).toBe(3);
  });
});

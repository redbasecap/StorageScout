import { describe, it, expect } from 'vitest';
import { filterItems } from '@/lib/sort-filter';
import type { Item } from '@/lib/types';

const makeItem = (overrides: Partial<Item> = {}): Item => ({
  id: 'item-1',
  name: 'Test Item',
  description: 'A test item',
  boxId: 'box-1',
  location: 'Garage',
  imageUrl: '',
  userId: 'user-1',
  createdAt: { toDate: () => new Date() } as any,
  ...overrides,
});

describe('filterItems with tags', () => {
  it('filters by tag name', () => {
    const items = [
      makeItem({ id: '1', name: 'Hammer', tags: ['tools', 'metal'] }),
      makeItem({ id: '2', name: 'Book', tags: ['reading'] }),
      makeItem({ id: '3', name: 'Screwdriver', tags: ['tools'] }),
    ];
    const result = filterItems(items, 'tools');
    expect(result.map((i) => i.id)).toEqual(['1', '3']);
  });

  it('tag filter is case-insensitive', () => {
    const items = [
      makeItem({ id: '1', name: 'Item', tags: ['Electronics'] }),
    ];
    const result = filterItems(items, 'electronics');
    expect(result).toHaveLength(1);
  });

  it('matches partial tag names', () => {
    const items = [
      makeItem({ id: '1', name: 'Item', tags: ['electronics'] }),
    ];
    const result = filterItems(items, 'electr');
    expect(result).toHaveLength(1);
  });

  it('returns items matching name OR tag', () => {
    const items = [
      makeItem({ id: '1', name: 'Electronics Kit', tags: [] }),
      makeItem({ id: '2', name: 'Hammer', tags: ['electronics'] }),
    ];
    const result = filterItems(items, 'electronics');
    expect(result).toHaveLength(2);
  });
});

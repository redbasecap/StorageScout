import { describe, it, expect } from 'vitest';
import { sortItems, filterItems } from '@/lib/sort-filter';
import type { Item } from '@/lib/types';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    name: 'Alpha',
    description: 'First item',
    boxId: 'box-1',
    location: 'Garage',
    imageUrl: '',
    userId: 'user-1',
    createdAt: { toDate: () => new Date('2024-06-01'), toMillis: () => new Date('2024-06-01').getTime() } as any,
    tags: [],
    ...overrides,
  };
}

describe('sortItems', () => {
  const items = [
    makeItem({ id: 'i1', name: 'Charlie', location: 'Attic', createdAt: { toDate: () => new Date('2024-03-01'), toMillis: () => new Date('2024-03-01').getTime() } as any }),
    makeItem({ id: 'i2', name: 'Alpha', location: 'Garage', createdAt: { toDate: () => new Date('2024-01-01'), toMillis: () => new Date('2024-01-01').getTime() } as any }),
    makeItem({ id: 'i3', name: 'Bravo', location: 'Basement', createdAt: { toDate: () => new Date('2024-06-01'), toMillis: () => new Date('2024-06-01').getTime() } as any }),
  ];

  it('sorts by name ascending', () => {
    const sorted = sortItems(items, 'name', 'asc');
    expect(sorted.map((i) => i.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('sorts by name descending', () => {
    const sorted = sortItems(items, 'name', 'desc');
    expect(sorted.map((i) => i.name)).toEqual(['Charlie', 'Bravo', 'Alpha']);
  });

  it('sorts by location ascending', () => {
    const sorted = sortItems(items, 'location', 'asc');
    expect(sorted.map((i) => i.location)).toEqual(['Attic', 'Basement', 'Garage']);
  });

  it('sorts by date ascending', () => {
    const sorted = sortItems(items, 'date', 'asc');
    expect(sorted.map((i) => i.id)).toEqual(['i2', 'i1', 'i3']);
  });

  it('sorts by date descending', () => {
    const sorted = sortItems(items, 'date', 'desc');
    expect(sorted.map((i) => i.id)).toEqual(['i3', 'i1', 'i2']);
  });

  it('does not mutate original array', () => {
    const original = [...items];
    sortItems(items, 'name', 'asc');
    expect(items.map((i) => i.id)).toEqual(original.map((i) => i.id));
  });
});

describe('filterItems', () => {
  const items = [
    makeItem({ id: 'i1', name: 'Screwdriver', description: 'Phillips head', location: 'Toolbox', tags: ['tools'] }),
    makeItem({ id: 'i2', name: 'Laptop', description: 'Work computer', location: 'Office', tags: ['electronics', 'work'] }),
    makeItem({ id: 'i3', name: 'Hammer', description: 'Ball-peen', location: 'Toolbox', tags: ['tools'] }),
  ];

  it('returns all items for empty filter', () => {
    expect(filterItems(items, '')).toHaveLength(3);
    expect(filterItems(items, '   ')).toHaveLength(3);
  });

  it('filters by name (case-insensitive)', () => {
    expect(filterItems(items, 'laptop')).toHaveLength(1);
    expect(filterItems(items, 'LAPTOP')).toHaveLength(1);
  });

  it('filters by description', () => {
    expect(filterItems(items, 'phillips')).toHaveLength(1);
  });

  it('filters by location', () => {
    expect(filterItems(items, 'toolbox')).toHaveLength(2);
  });

  it('filters by tag', () => {
    expect(filterItems(items, 'electronics')).toHaveLength(1);
    expect(filterItems(items, 'tools')).toHaveLength(2);
  });

  it('returns empty for no matches', () => {
    expect(filterItems(items, 'nonexistent')).toHaveLength(0);
  });
});

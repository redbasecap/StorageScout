import { describe, it, expect } from 'vitest';
import { sortItems, filterItems } from '@/lib/sort-filter';
import type { Item } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

function makeItem(overrides: Partial<Item> & { name: string }): Item {
  return {
    id: overrides.id ?? overrides.name.toLowerCase().replace(/\s/g, '-'),
    name: overrides.name,
    description: overrides.description ?? '',
    boxId: overrides.boxId ?? 'box-1',
    location: overrides.location ?? 'Garage',
    imageUrl: overrides.imageUrl ?? '',
    userId: overrides.userId ?? 'user-1',
    createdAt: overrides.createdAt ?? Timestamp.fromDate(new Date('2025-01-01')),
    tags: overrides.tags,
  };
}

const items: Item[] = [
  makeItem({ name: 'Banana', location: 'Kitchen', createdAt: Timestamp.fromDate(new Date('2025-03-01')), tags: ['fruit', 'yellow'] }),
  makeItem({ name: 'Apple', location: 'Pantry', createdAt: Timestamp.fromDate(new Date('2025-01-15')), tags: ['fruit', 'red'] }),
  makeItem({ name: 'Drill', location: 'Garage', createdAt: Timestamp.fromDate(new Date('2025-02-10')), tags: ['tools'] }),
];

describe('sortItems', () => {
  it('sorts by name ascending', () => {
    const result = sortItems(items, 'name', 'asc');
    expect(result.map(i => i.name)).toEqual(['Apple', 'Banana', 'Drill']);
  });

  it('sorts by name descending', () => {
    const result = sortItems(items, 'name', 'desc');
    expect(result.map(i => i.name)).toEqual(['Drill', 'Banana', 'Apple']);
  });

  it('sorts by date ascending', () => {
    const result = sortItems(items, 'date', 'asc');
    expect(result.map(i => i.name)).toEqual(['Apple', 'Drill', 'Banana']);
  });

  it('sorts by date descending', () => {
    const result = sortItems(items, 'date', 'desc');
    expect(result.map(i => i.name)).toEqual(['Banana', 'Drill', 'Apple']);
  });

  it('sorts by location ascending', () => {
    const result = sortItems(items, 'location', 'asc');
    expect(result.map(i => i.name)).toEqual(['Drill', 'Banana', 'Apple']);
  });

  it('sorts by location descending', () => {
    const result = sortItems(items, 'location', 'desc');
    expect(result.map(i => i.name)).toEqual(['Apple', 'Banana', 'Drill']);
  });

  it('does not mutate original array', () => {
    const original = [...items];
    sortItems(items, 'name', 'asc');
    expect(items.map(i => i.name)).toEqual(original.map(i => i.name));
  });
});

describe('filterItems', () => {
  it('returns all items for empty filter', () => {
    expect(filterItems(items, '')).toEqual(items);
    expect(filterItems(items, '   ')).toEqual(items);
  });

  it('filters by name case-insensitive', () => {
    const result = filterItems(items, 'apple');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Apple');
  });

  it('filters by location', () => {
    const result = filterItems(items, 'garage');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Drill');
  });

  it('filters by description', () => {
    const withDesc = [makeItem({ name: 'Lamp', description: 'Bright LED desk lamp' })];
    const result = filterItems(withDesc, 'LED');
    expect(result).toHaveLength(1);
  });

  it('filters by tags', () => {
    const result = filterItems(items, 'fruit');
    expect(result).toHaveLength(2);
    expect(result.map(i => i.name).sort()).toEqual(['Apple', 'Banana']);
  });

  it('filters by tag partial match', () => {
    const result = filterItems(items, 'yell');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Banana');
  });

  it('returns empty for no match', () => {
    expect(filterItems(items, 'xyz123')).toHaveLength(0);
  });

  it('matches across multiple fields', () => {
    // 'Kitchen' matches location of Banana
    const result = filterItems(items, 'Kitchen');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Banana');
  });
});

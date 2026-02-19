import { describe, it, expect } from 'vitest';
import type { Item } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

// Replicate the search filter logic from search/page.tsx
function filterItems(items: Item[], query: string): Item[] {
  const lower = query.toLowerCase();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.description?.toLowerCase().includes(lower) ||
      item.location?.toLowerCase().includes(lower) ||
      item.boxId.toLowerCase().includes(lower)
  );
}

const mockItems: Item[] = [
  {
    id: '1',
    name: 'Winter Jacket',
    description: 'Blue parka, size L',
    boxId: 'abc-123',
    location: 'Garage Shelf A',
    imageUrl: '',
    userId: 'user1',
    createdAt: Timestamp.now(),
  },
  {
    id: '2',
    name: 'Summer Hat',
    description: 'Straw hat with ribbon',
    boxId: 'def-456',
    location: 'Bedroom Closet',
    imageUrl: '',
    userId: 'user1',
    createdAt: Timestamp.now(),
  },
  {
    id: '3',
    name: 'Screwdriver Set',
    description: 'Phillips and flathead, 12 pieces',
    boxId: 'abc-123',
    location: 'Garage Shelf A',
    imageUrl: '',
    userId: 'user1',
    createdAt: Timestamp.now(),
  },
];

describe('Search filtering', () => {
  it('filters by item name (case-insensitive)', () => {
    const results = filterItems(mockItems, 'winter');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Winter Jacket');
  });

  it('filters by description', () => {
    const results = filterItems(mockItems, 'ribbon');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Summer Hat');
  });

  it('filters by location', () => {
    const results = filterItems(mockItems, 'garage');
    expect(results).toHaveLength(2);
  });

  it('filters by boxId', () => {
    const results = filterItems(mockItems, 'def-456');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Summer Hat');
  });

  it('returns empty array for no matches', () => {
    const results = filterItems(mockItems, 'nonexistent');
    expect(results).toHaveLength(0);
  });

  it('matches partial strings', () => {
    const results = filterItems(mockItems, 'screw');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Screwdriver Set');
  });

  it('is case-insensitive', () => {
    const results = filterItems(mockItems, 'SUMMER');
    expect(results).toHaveLength(1);
  });
});

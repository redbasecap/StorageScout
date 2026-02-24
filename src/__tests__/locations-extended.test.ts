import { describe, it, expect } from 'vitest';
import { getLocationSummaries, getUniqueLocations } from '@/lib/locations';
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

describe('getLocationSummaries - extended', () => {
  it('handles items with whitespace-only locations', () => {
    const items = [
      makeItem({ id: '1', location: '   ' }),
      makeItem({ id: '2', location: 'Garage' }),
    ];
    const summaries = getLocationSummaries(items);
    expect(summaries.length).toBe(1);
    expect(summaries[0].name).toBe('Garage');
  });

  it('counts multiple boxes per location correctly', () => {
    const items = [
      makeItem({ id: '1', location: 'Keller', boxId: 'box-a' }),
      makeItem({ id: '2', location: 'Keller', boxId: 'box-b' }),
      makeItem({ id: '3', location: 'Keller', boxId: 'box-a' }),
    ];
    const summaries = getLocationSummaries(items);
    expect(summaries[0].itemCount).toBe(3);
    expect(summaries[0].boxIds.length).toBe(2);
  });

  it('sorts by item count descending', () => {
    const items = [
      makeItem({ id: '1', location: 'A' }),
      makeItem({ id: '2', location: 'B' }),
      makeItem({ id: '3', location: 'B' }),
      makeItem({ id: '4', location: 'C' }),
      makeItem({ id: '5', location: 'C' }),
      makeItem({ id: '6', location: 'C' }),
    ];
    const summaries = getLocationSummaries(items);
    expect(summaries[0].name).toBe('C');
    expect(summaries[1].name).toBe('B');
    expect(summaries[2].name).toBe('A');
  });

  it('treats locations as case-sensitive', () => {
    const items = [
      makeItem({ id: '1', location: 'garage' }),
      makeItem({ id: '2', location: 'Garage' }),
    ];
    const summaries = getLocationSummaries(items);
    expect(summaries.length).toBe(2);
  });
});

describe('getUniqueLocations - extended', () => {
  it('returns sorted unique locations', () => {
    const items = [
      makeItem({ id: '1', location: 'Zug' }),
      makeItem({ id: '2', location: 'Attic' }),
      makeItem({ id: '3', location: 'Zug' }),
      makeItem({ id: '4', location: 'Basement' }),
    ];
    const locs = getUniqueLocations(items);
    expect(locs).toEqual(['Attic', 'Basement', 'Zug']);
  });

  it('excludes empty and whitespace locations', () => {
    const items = [
      makeItem({ id: '1', location: '' }),
      makeItem({ id: '2', location: '  ' }),
      makeItem({ id: '3', location: 'Valid' }),
    ];
    const locs = getUniqueLocations(items);
    expect(locs).toEqual(['Valid']);
  });

  it('handles all empty locations', () => {
    const items = [makeItem({ id: '1', location: '' })];
    expect(getUniqueLocations(items)).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { getLocationSummaries, getUniqueLocations } from '@/lib/locations';
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

describe('getLocationSummaries', () => {
  it('returns empty array for no items', () => {
    expect(getLocationSummaries([])).toEqual([]);
  });

  it('groups items by location', () => {
    const items = [
      makeItem({ id: '1', location: 'Garage', boxId: 'box-1' }),
      makeItem({ id: '2', location: 'Garage', boxId: 'box-2' }),
      makeItem({ id: '3', location: 'Kitchen', boxId: 'box-3' }),
    ];
    const summaries = getLocationSummaries(items);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].name).toBe('Garage');
    expect(summaries[0].itemCount).toBe(2);
    expect(summaries[0].boxIds).toContain('box-1');
    expect(summaries[0].boxIds).toContain('box-2');
    expect(summaries[1].name).toBe('Kitchen');
    expect(summaries[1].itemCount).toBe(1);
  });

  it('sorts by item count descending', () => {
    const items = [
      makeItem({ id: '1', location: 'A' }),
      makeItem({ id: '2', location: 'B' }),
      makeItem({ id: '3', location: 'B' }),
      makeItem({ id: '4', location: 'B' }),
    ];
    const summaries = getLocationSummaries(items);
    expect(summaries[0].name).toBe('B');
    expect(summaries[0].itemCount).toBe(3);
  });

  it('skips items with empty location', () => {
    const items = [
      makeItem({ id: '1', location: '' }),
      makeItem({ id: '2', location: 'Garage' }),
    ];
    const summaries = getLocationSummaries(items);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].name).toBe('Garage');
  });

  it('deduplicates box IDs per location', () => {
    const items = [
      makeItem({ id: '1', location: 'Garage', boxId: 'box-1' }),
      makeItem({ id: '2', location: 'Garage', boxId: 'box-1' }),
    ];
    const summaries = getLocationSummaries(items);
    expect(summaries[0].boxIds).toHaveLength(1);
  });
});

describe('getUniqueLocations', () => {
  it('returns empty array for no items', () => {
    expect(getUniqueLocations([])).toEqual([]);
  });

  it('returns sorted unique locations', () => {
    const items = [
      makeItem({ id: '1', location: 'Garage' }),
      makeItem({ id: '2', location: 'Kitchen' }),
      makeItem({ id: '3', location: 'Garage' }),
      makeItem({ id: '4', location: 'Attic' }),
    ];
    expect(getUniqueLocations(items)).toEqual(['Attic', 'Garage', 'Kitchen']);
  });

  it('skips empty locations', () => {
    const items = [
      makeItem({ id: '1', location: '' }),
      makeItem({ id: '2', location: 'Garage' }),
    ];
    expect(getUniqueLocations(items)).toEqual(['Garage']);
  });

  it('trims whitespace', () => {
    const items = [
      makeItem({ id: '1', location: '  Garage  ' }),
    ];
    expect(getUniqueLocations(items)).toEqual(['Garage']);
  });
});

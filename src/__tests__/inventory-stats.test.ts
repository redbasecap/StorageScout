import { describe, it, expect } from 'vitest';
import type { Box, Item } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: '1',
    name: 'Test Item',
    description: '',
    boxId: 'box-1',
    location: 'Garage',
    imageUrl: '',
    userId: 'user1',
    createdAt: Timestamp.now(),
    ...overrides,
  };
}

function computeStats(boxes: Box[]) {
  const totalItems = boxes.reduce((sum, box) => sum + box.items.length, 0);
  const totalBoxes = boxes.length;
  const uniqueLocations = new Set(
    boxes
      .flatMap((box) => box.items.map((item) => item.location))
      .filter(Boolean)
  ).size;
  return { totalItems, totalBoxes, uniqueLocations };
}

describe('Inventory stats computation', () => {
  it('computes zero stats for empty inventory', () => {
    const stats = computeStats([]);
    expect(stats).toEqual({ totalItems: 0, totalBoxes: 0, uniqueLocations: 0 });
  });

  it('counts items across boxes', () => {
    const boxes: Box[] = [
      { id: 'box-1', items: [makeItem(), makeItem({ id: '2' })] },
      { id: 'box-2', items: [makeItem({ id: '3', boxId: 'box-2' })] },
    ];
    const stats = computeStats(boxes);
    expect(stats.totalItems).toBe(3);
    expect(stats.totalBoxes).toBe(2);
  });

  it('counts unique locations', () => {
    const boxes: Box[] = [
      {
        id: 'box-1',
        items: [
          makeItem({ location: 'Garage' }),
          makeItem({ id: '2', location: 'Garage' }),
        ],
      },
      {
        id: 'box-2',
        items: [makeItem({ id: '3', location: 'Bedroom', boxId: 'box-2' })],
      },
    ];
    const stats = computeStats(boxes);
    expect(stats.uniqueLocations).toBe(2);
  });

  it('ignores empty locations', () => {
    const boxes: Box[] = [
      {
        id: 'box-1',
        items: [makeItem({ location: '' }), makeItem({ id: '2', location: 'Attic' })],
      },
    ];
    const stats = computeStats(boxes);
    expect(stats.uniqueLocations).toBe(1);
  });
});

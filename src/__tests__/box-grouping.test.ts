import { describe, it, expect } from 'vitest';
import type { Item, Box } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

// Replicate the box grouping logic from main page
function groupItemsIntoBoxes(items: Item[]): Box[] {
  const groupedByBoxId = items.reduce<Record<string, Box>>((acc, item) => {
    if (!acc[item.boxId]) {
      acc[item.boxId] = { id: item.boxId, items: [], location: item.location };
    }
    acc[item.boxId].items.push(item);
    return acc;
  }, {});

  const sortedBoxes: Box[] = [];
  const seenBoxIds = new Set<string>();

  for (const item of items) {
    if (!seenBoxIds.has(item.boxId)) {
      sortedBoxes.push(groupedByBoxId[item.boxId]);
      seenBoxIds.add(item.boxId);
    }
  }

  return sortedBoxes;
}

const makeItem = (id: string, boxId: string, name: string): Item => ({
  id,
  name,
  description: '',
  boxId,
  location: 'Test Location',
  imageUrl: '',
  userId: 'user1',
  createdAt: Timestamp.now(),
});

describe('Box grouping logic', () => {
  it('groups items by boxId', () => {
    const items = [
      makeItem('1', 'box-a', 'Item 1'),
      makeItem('2', 'box-b', 'Item 2'),
      makeItem('3', 'box-a', 'Item 3'),
    ];
    const boxes = groupItemsIntoBoxes(items);
    expect(boxes).toHaveLength(2);
    expect(boxes[0].id).toBe('box-a');
    expect(boxes[0].items).toHaveLength(2);
    expect(boxes[1].id).toBe('box-b');
    expect(boxes[1].items).toHaveLength(1);
  });

  it('preserves order based on first item appearance', () => {
    const items = [
      makeItem('1', 'box-b', 'Item 1'),
      makeItem('2', 'box-a', 'Item 2'),
      makeItem('3', 'box-b', 'Item 3'),
    ];
    const boxes = groupItemsIntoBoxes(items);
    expect(boxes[0].id).toBe('box-b');
    expect(boxes[1].id).toBe('box-a');
  });

  it('returns empty array for no items', () => {
    const boxes = groupItemsIntoBoxes([]);
    expect(boxes).toHaveLength(0);
  });

  it('uses first item location as box location', () => {
    const items = [
      { ...makeItem('1', 'box-a', 'Item 1'), location: 'Garage' },
      { ...makeItem('2', 'box-a', 'Item 2'), location: 'Attic' },
    ];
    const boxes = groupItemsIntoBoxes(items);
    expect(boxes[0].location).toBe('Garage');
  });

  it('handles single item', () => {
    const items = [makeItem('1', 'box-a', 'Solo Item')];
    const boxes = groupItemsIntoBoxes(items);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].items).toHaveLength(1);
  });
});

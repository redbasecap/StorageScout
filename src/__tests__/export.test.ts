import { describe, it, expect } from 'vitest';
import { itemsToCsv } from '@/lib/export';
import type { Item } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: '1',
    name: 'Test Item',
    description: 'A description',
    boxId: 'box-1',
    location: 'Garage',
    imageUrl: '',
    userId: 'user1',
    createdAt: Timestamp.fromDate(new Date('2026-01-15T10:00:00Z')),
    ...overrides,
  };
}

describe('itemsToCsv', () => {
  it('produces correct headers', () => {
    const csv = itemsToCsv([]);
    expect(csv).toBe('Name,Description,Box ID,Location,Tags,Created At');
  });

  it('exports a single item', () => {
    const csv = itemsToCsv([makeItem()]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Test Item');
    expect(lines[1]).toContain('Garage');
    expect(lines[1]).toContain('box-1');
  });

  it('escapes commas in fields', () => {
    const csv = itemsToCsv([makeItem({ name: 'Item, with comma' })]);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('"Item, with comma"');
  });

  it('escapes quotes in fields', () => {
    const csv = itemsToCsv([makeItem({ description: 'Said "hello"' })]);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('"Said ""hello"""');
  });

  it('handles empty descriptions', () => {
    const csv = itemsToCsv([makeItem({ description: '' })]);
    const lines = csv.split('\n');
    // Should not crash and should have correct number of commas
    expect(lines[1].split(',').length).toBeGreaterThanOrEqual(6);
  });

  it('exports multiple items', () => {
    const items = [
      makeItem({ id: '1', name: 'Item A' }),
      makeItem({ id: '2', name: 'Item B' }),
      makeItem({ id: '3', name: 'Item C' }),
    ];
    const csv = itemsToCsv(items);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(4); // 1 header + 3 items
  });
});

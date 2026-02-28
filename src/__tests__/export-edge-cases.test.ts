import { describe, it, expect } from 'vitest';
import { itemsToCsv } from '@/lib/export';
import type { Item } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';

const makeTimestamp = (ms: number): Timestamp =>
  ({ toMillis: () => ms, toDate: () => new Date(ms) } as Timestamp);

const makeItem = (overrides: Partial<Item>): Item => ({
  id: 'item-1',
  name: 'Test',
  description: '',
  boxId: 'box-1',
  location: 'Garage',
  imageUrl: '',
  userId: 'user-1',
  createdAt: makeTimestamp(1700000000000),
  ...overrides,
});

describe('itemsToCsv edge cases', () => {
  it('exports empty array with just headers', () => {
    const csv = itemsToCsv([]);
    expect(csv).toBe('Name,Description,Box ID,Location,Tags,Created At');
  });

  it('escapes fields containing commas', () => {
    const csv = itemsToCsv([makeItem({ name: 'Laptop, 15"' })]);
    expect(csv).toContain('"Laptop, 15"""');
  });

  it('escapes fields containing newlines', () => {
    const csv = itemsToCsv([makeItem({ description: 'Line 1\nLine 2' })]);
    expect(csv).toContain('"Line 1\nLine 2"');
  });

  it('handles items with tags', () => {
    const csv = itemsToCsv([makeItem({ tags: ['electronics', 'fragile'] })]);
    expect(csv).toContain('electronics; fragile');
  });

  it('handles items without tags', () => {
    const csv = itemsToCsv([makeItem({ tags: undefined })]);
    const lines = csv.split('\n');
    // Tags field should be empty
    expect(lines[1]).toContain(',,');
  });

  it('handles items with missing createdAt', () => {
    const csv = itemsToCsv([makeItem({ createdAt: undefined as unknown as Timestamp })]);
    const lines = csv.split('\n');
    // Last field should be empty
    expect(lines[1].endsWith(',')).toBe(true);
  });
});

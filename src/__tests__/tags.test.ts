import { describe, it, expect } from 'vitest';
import type { Item } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

function parseTags(input: string): string[] {
  return input.split(',').map(t => t.trim()).filter(Boolean);
}

describe('Tag parsing', () => {
  it('parses comma-separated tags', () => {
    expect(parseTags('electronics, fragile, winter')).toEqual(['electronics', 'fragile', 'winter']);
  });

  it('trims whitespace', () => {
    expect(parseTags('  foo ,  bar  , baz  ')).toEqual(['foo', 'bar', 'baz']);
  });

  it('removes empty tags', () => {
    expect(parseTags('a,,b,,,c')).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for empty input', () => {
    expect(parseTags('')).toEqual([]);
  });

  it('handles single tag', () => {
    expect(parseTags('solo')).toEqual(['solo']);
  });
});

describe('Item type with tags', () => {
  it('supports optional tags field', () => {
    const item: Item = {
      id: '1',
      name: 'Test',
      description: 'desc',
      boxId: 'box-1',
      location: 'here',
      imageUrl: '',
      userId: 'u1',
      createdAt: Timestamp.fromDate(new Date()),
      tags: ['electronics', 'fragile'],
    };
    expect(item.tags).toEqual(['electronics', 'fragile']);
  });

  it('tags is optional', () => {
    const item: Item = {
      id: '2',
      name: 'No tags',
      description: '',
      boxId: 'box-1',
      location: 'there',
      imageUrl: '',
      userId: 'u1',
      createdAt: Timestamp.fromDate(new Date()),
    };
    expect(item.tags).toBeUndefined();
  });
});

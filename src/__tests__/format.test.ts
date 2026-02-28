import { describe, it, expect } from 'vitest';
import { formatRelativeDate, truncateUuid, pluralize } from '@/lib/format';

describe('formatRelativeDate', () => {
  const now = new Date('2026-02-28T12:00:00Z');

  it('returns "just now" for <60 seconds', () => {
    const date = new Date(now.getTime() - 30_000);
    expect(formatRelativeDate(date, now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const date = new Date(now.getTime() - 5 * 60_000);
    expect(formatRelativeDate(date, now)).toBe('5 minutes ago');
  });

  it('returns "1 minute ago" (singular)', () => {
    const date = new Date(now.getTime() - 60_000);
    expect(formatRelativeDate(date, now)).toBe('1 minute ago');
  });

  it('returns hours ago', () => {
    const date = new Date(now.getTime() - 3 * 3600_000);
    expect(formatRelativeDate(date, now)).toBe('3 hours ago');
  });

  it('returns "yesterday"', () => {
    const date = new Date(now.getTime() - 24 * 3600_000);
    expect(formatRelativeDate(date, now)).toBe('yesterday');
  });

  it('returns days ago', () => {
    const date = new Date(now.getTime() - 5 * 24 * 3600_000);
    expect(formatRelativeDate(date, now)).toBe('5 days ago');
  });

  it('returns formatted date for 30+ days', () => {
    const date = new Date(now.getTime() - 45 * 24 * 3600_000);
    const result = formatRelativeDate(date, now);
    expect(result).toMatch(/Jan/); // ~Jan 14, 2026
  });
});

describe('truncateUuid', () => {
  it('truncates long UUIDs', () => {
    expect(truncateUuid('123e4567-e89b-12d3-a456-426614174000')).toBe('123e4567...4000');
  });

  it('returns short strings as-is', () => {
    expect(truncateUuid('abc')).toBe('abc');
  });

  it('respects custom lengths', () => {
    expect(truncateUuid('123e4567-e89b-12d3-a456-426614174000', 4, 4)).toBe('123e...4000');
  });
});

describe('pluralize', () => {
  it('returns singular for 1', () => {
    expect(pluralize(1, 'item')).toBe('item');
  });

  it('returns plural for 0', () => {
    expect(pluralize(0, 'item')).toBe('items');
  });

  it('returns plural for >1', () => {
    expect(pluralize(5, 'item')).toBe('items');
  });

  it('uses custom plural', () => {
    expect(pluralize(2, 'box', 'boxes')).toBe('boxes');
  });
});

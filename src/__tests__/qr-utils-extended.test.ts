import { describe, it, expect } from 'vitest';
import { extractBoxId } from '@/lib/qr-utils';

describe('extractBoxId - extended cases', () => {
  it('extracts UUID from a full URL', () => {
    const result = extractBoxId('https://storagescout.app/box?id=550e8400-e29b-41d4-a716-446655440000');
    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('extracts UUID from URL with path segments', () => {
    const result = extractBoxId('https://example.com/box/550e8400-e29b-41d4-a716-446655440000/details');
    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('handles UUID with surrounding whitespace', () => {
    const result = extractBoxId('  550e8400-e29b-41d4-a716-446655440000  ');
    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('handles uppercase UUIDs', () => {
    const result = extractBoxId('550E8400-E29B-41D4-A716-446655440000');
    expect(result).toBe('550E8400-E29B-41D4-A716-446655440000');
  });

  it('accepts short alphanumeric IDs', () => {
    const result = extractBoxId('abc123');
    expect(result).toBe('abc123');
  });

  it('accepts IDs with hyphens and underscores', () => {
    const result = extractBoxId('box_label-42');
    expect(result).toBe('box_label-42');
  });

  it('rejects empty string', () => {
    expect(extractBoxId('')).toBeNull();
  });

  it('rejects very short strings', () => {
    expect(extractBoxId('ab')).toBeNull();
  });

  it('rejects strings with spaces (no UUID)', () => {
    expect(extractBoxId('not a valid id')).toBeNull();
  });

  it('extracts UUID from text with prefix', () => {
    const result = extractBoxId('Box ID: 550e8400-e29b-41d4-a716-446655440000');
    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('handles mixed case URL with UUID', () => {
    const result = extractBoxId('HTTP://APP.COM/BOX/550e8400-e29b-41d4-a716-446655440000');
    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});

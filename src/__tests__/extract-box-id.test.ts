import { describe, it, expect } from 'vitest';
import { extractBoxId } from '@/lib/qr-utils';

describe('extractBoxId', () => {
  it('extracts UUID from raw string', () => {
    expect(extractBoxId('123e4567-e89b-12d3-a456-426614174000')).toBe(
      '123e4567-e89b-12d3-a456-426614174000'
    );
  });

  it('extracts UUID from URL', () => {
    expect(
      extractBoxId('https://app.storagescout.com/box/123e4567-e89b-12d3-a456-426614174000')
    ).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('extracts UUID with uppercase letters', () => {
    expect(extractBoxId('123E4567-E89B-12D3-A456-426614174000')).toBe(
      '123E4567-E89B-12D3-A456-426614174000'
    );
  });

  it('handles whitespace around UUID', () => {
    expect(extractBoxId('  123e4567-e89b-12d3-a456-426614174000  ')).toBe(
      '123e4567-e89b-12d3-a456-426614174000'
    );
  });

  it('accepts short alphanumeric IDs as fallback', () => {
    expect(extractBoxId('box123')).toBe('box123');
  });

  it('rejects IDs shorter than 3 chars', () => {
    expect(extractBoxId('ab')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(extractBoxId('')).toBeNull();
  });

  it('rejects special characters without UUID', () => {
    expect(extractBoxId('hello world!')).toBeNull();
  });
});

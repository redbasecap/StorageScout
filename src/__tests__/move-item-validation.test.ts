import { describe, it, expect } from 'vitest';

/**
 * Validates the move-item logic (without Firebase).
 * Mirrors the validation in MoveItemDialog.
 */

function validateMove(currentBoxId: string, newBoxId: string): string | null {
  const trimmed = newBoxId.trim();
  if (!trimmed) return 'Target box ID is required';
  if (trimmed === currentBoxId) return 'Item is already in this box';
  return null; // valid
}

describe('Move item validation', () => {
  it('rejects empty target box ID', () => {
    expect(validateMove('box-1', '')).toBe('Target box ID is required');
  });

  it('rejects whitespace-only target', () => {
    expect(validateMove('box-1', '   ')).toBe('Target box ID is required');
  });

  it('rejects same box ID', () => {
    expect(validateMove('box-1', 'box-1')).toBe('Item is already in this box');
  });

  it('accepts different box ID', () => {
    expect(validateMove('box-1', 'box-2')).toBeNull();
  });

  it('trims whitespace before comparing', () => {
    expect(validateMove('box-1', '  box-1  ')).toBe('Item is already in this box');
  });

  it('accepts UUID format', () => {
    expect(
      validateMove(
        '123e4567-e89b-12d3-a456-426614174000',
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
      )
    ).toBeNull();
  });
});

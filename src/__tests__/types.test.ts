import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirrors the validation schema from add-item-form.tsx
const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
});

describe('Item validation schema', () => {
  it('accepts valid item data', () => {
    const result = itemSchema.safeParse({
      name: 'Winter Jacket',
      location: 'Garage Shelf A',
      description: 'Blue, size L',
    });
    expect(result.success).toBe(true);
  });

  it('accepts item without description', () => {
    const result = itemSchema.safeParse({
      name: 'Winter Jacket',
      location: 'Garage Shelf A',
    });
    expect(result.success).toBe(true);
  });

  it('rejects item without name', () => {
    const result = itemSchema.safeParse({
      name: '',
      location: 'Garage Shelf A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects item without location', () => {
    const result = itemSchema.safeParse({
      name: 'Winter Jacket',
      location: '',
    });
    expect(result.success).toBe(false);
  });
});

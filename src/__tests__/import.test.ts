import { describe, it, expect } from 'vitest';
import { parseCsvToItems, validateImport } from '@/lib/import';

describe('parseCsvToItems', () => {
  it('parses a basic CSV with all columns', () => {
    const csv = `Name,Description,Box ID,Location,Tags,Created At
Widget,A small widget,box-001,Garage,tools; small,2024-01-01T00:00:00Z
Gadget,A cool gadget,box-002,Attic,electronics,2024-02-01T00:00:00Z`;

    const { items, errors } = parseCsvToItems(csv);
    expect(errors).toHaveLength(0);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      name: 'Widget',
      description: 'A small widget',
      boxId: 'box-001',
      location: 'Garage',
      imageUrl: '',
      tags: ['tools', 'small'],
    });
    expect(items[1].tags).toEqual(['electronics']);
  });

  it('handles quoted fields with commas', () => {
    const csv = `Name,Description,Box ID,Location,Tags,Created At
"Item, with comma","Desc with ""quotes""",box-001,Home,,`;

    const { items, errors } = parseCsvToItems(csv);
    expect(errors).toHaveLength(0);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Item, with comma');
    expect(items[0].description).toBe('Desc with "quotes"');
  });

  it('returns error for empty CSV', () => {
    const { items, errors } = parseCsvToItems('');
    expect(items).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('empty');
  });

  it('returns error for missing Name column', () => {
    const csv = `Description,Box ID\nSomething,box-1`;
    const { items, errors } = parseCsvToItems(csv);
    expect(items).toHaveLength(0);
    expect(errors[0]).toContain('Name');
  });

  it('returns error for missing Box ID column', () => {
    const csv = `Name,Description\nThing,A thing`;
    const { items, errors } = parseCsvToItems(csv);
    expect(items).toHaveLength(0);
    expect(errors[0]).toContain('Box ID');
  });

  it('skips rows with missing name', () => {
    const csv = `Name,Box ID\n,box-1\nValid,box-2`;
    const { items, errors } = parseCsvToItems(csv);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Valid');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Row 2');
  });

  it('skips rows with missing box ID', () => {
    const csv = `Name,Box ID\nThing,\nOther,box-2`;
    const { items, errors } = parseCsvToItems(csv);
    expect(items).toHaveLength(1);
    expect(errors).toHaveLength(1);
  });

  it('handles CSV with no tags column', () => {
    const csv = `Name,Box ID,Location\nWidget,box-1,Garage`;
    const { items } = parseCsvToItems(csv);
    expect(items).toHaveLength(1);
    expect(items[0].tags).toBeUndefined();
  });

  it('skips empty lines', () => {
    const csv = `Name,Box ID\nA,box-1\n\nB,box-2\n`;
    const { items } = parseCsvToItems(csv);
    expect(items).toHaveLength(2);
  });

  it('handles semicolon-separated tags', () => {
    const csv = `Name,Box ID,Tags\nThing,box-1,a; b; c`;
    const { items } = parseCsvToItems(csv);
    expect(items[0].tags).toEqual(['a', 'b', 'c']);
  });
});

describe('validateImport', () => {
  it('returns correct summary stats', () => {
    const items = [
      { name: 'A', description: '', boxId: 'box-1', location: 'Garage', imageUrl: '', tags: ['x', 'y'] },
      { name: 'B', description: '', boxId: 'box-1', location: 'Garage', imageUrl: '', tags: ['y', 'z'] },
      { name: 'C', description: '', boxId: 'box-2', location: 'Attic', imageUrl: '' },
    ];

    const result = validateImport(items);
    expect(result.totalItems).toBe(3);
    expect(result.uniqueBoxes).toBe(2);
    expect(result.uniqueLocations).toBe(2);
    expect(result.uniqueTags).toEqual(['x', 'y', 'z']);
  });

  it('handles empty import', () => {
    const result = validateImport([]);
    expect(result.totalItems).toBe(0);
    expect(result.uniqueBoxes).toBe(0);
  });
});

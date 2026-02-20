import { describe, it, expect } from 'vitest';

/**
 * Tests for box label map operations (pure logic, no Firebase).
 */

type BoxLabel = { id: string; name: string; userId: string };

function buildLabelMap(labels: BoxLabel[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const label of labels) {
    map.set(label.id, label.name);
  }
  return map;
}

describe('Box label map', () => {
  it('builds empty map from empty array', () => {
    const map = buildLabelMap([]);
    expect(map.size).toBe(0);
  });

  it('maps box IDs to names', () => {
    const labels: BoxLabel[] = [
      { id: 'box-1', name: 'Winter Clothes', userId: 'u1' },
      { id: 'box-2', name: 'Tools', userId: 'u1' },
    ];
    const map = buildLabelMap(labels);
    expect(map.get('box-1')).toBe('Winter Clothes');
    expect(map.get('box-2')).toBe('Tools');
  });

  it('returns undefined for unlabeled boxes', () => {
    const labels: BoxLabel[] = [
      { id: 'box-1', name: 'Kitchen', userId: 'u1' },
    ];
    const map = buildLabelMap(labels);
    expect(map.get('box-999')).toBeUndefined();
  });

  it('last label wins for duplicate IDs', () => {
    const labels: BoxLabel[] = [
      { id: 'box-1', name: 'Old Name', userId: 'u1' },
      { id: 'box-1', name: 'New Name', userId: 'u1' },
    ];
    const map = buildLabelMap(labels);
    expect(map.get('box-1')).toBe('New Name');
  });
});

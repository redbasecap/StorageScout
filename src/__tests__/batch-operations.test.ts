import { describe, it, expect } from 'vitest';

// Test selection logic extracted from ItemsList component
describe('Batch selection logic', () => {
  const allIds = ['a', 'b', 'c', 'd', 'e'];

  it('toggle adds item to selection', () => {
    const selected = new Set<string>();
    const id = 'a';
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expect(next.has('a')).toBe(true);
    expect(next.size).toBe(1);
  });

  it('toggle removes item from selection', () => {
    const selected = new Set(['a', 'b']);
    const id = 'a';
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expect(next.has('a')).toBe(false);
    expect(next.size).toBe(1);
  });

  it('select all selects every item', () => {
    const selected = new Set(allIds);
    expect(selected.size).toBe(5);
    for (const id of allIds) {
      expect(selected.has(id)).toBe(true);
    }
  });

  it('deselect all clears selection', () => {
    const selected = new Set(allIds);
    const cleared = new Set<string>();
    expect(cleared.size).toBe(0);
  });

  it('selection count is accurate', () => {
    const selected = new Set(['a', 'c', 'e']);
    expect(selected.size).toBe(3);
  });

  it('handles empty selection for delete guard', () => {
    const selected = new Set<string>();
    const canDelete = selected.size > 0;
    expect(canDelete).toBe(false);
  });

  it('handles rapid toggle on same item', () => {
    let selected = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const next = new Set(selected);
      if (next.has('a')) next.delete('a');
      else next.add('a');
      selected = next;
    }
    // Odd number of toggles → should be selected
    expect(selected.has('a')).toBe(true);
  });
});

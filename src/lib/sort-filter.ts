import type { Item } from './types';
import type { SortField, SortDirection } from '@/components/sort-filter-bar';

export function sortItems(items: Item[], field: SortField, direction: SortDirection): Item[] {
  const sorted = [...items].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'location':
        cmp = (a.location || '').localeCompare(b.location || '');
        break;
      case 'date':
        cmp = (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0);
        break;
    }
    return direction === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

export function filterItems(items: Item[], text: string): Item[] {
  if (!text.trim()) return items;
  const lower = text.toLowerCase();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.description?.toLowerCase().includes(lower) ||
      item.location?.toLowerCase().includes(lower) ||
      (item.tags?.some(t => t.toLowerCase().includes(lower)) ?? false)
  );
}

import type { Item } from '@/lib/types';

export function exportItemsToCSV(items: Item[], filename = 'inventory.csv') {
  const headers = ['Name', 'Description', 'Box ID', 'Location', 'Image URL', 'Created At'];
  const rows = items.map(item => [
    escapeCsvField(item.name),
    escapeCsvField(item.description),
    escapeCsvField(item.boxId),
    escapeCsvField(item.location),
    escapeCsvField(item.imageUrl),
    item.createdAt?.toDate?.() ? item.createdAt.toDate().toISOString() : '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

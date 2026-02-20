import type { Item } from './types';

/**
 * Export items to CSV format.
 */
export function itemsToCsv(items: Item[]): string {
  const headers = ['Name', 'Description', 'Box ID', 'Location', 'Created At'];
  const rows = items.map((item) => [
    escapeCsvField(item.name),
    escapeCsvField(item.description),
    escapeCsvField(item.boxId),
    escapeCsvField(item.location),
    item.createdAt?.toDate?.()
      ? item.createdAt.toDate().toISOString()
      : '',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function escapeCsvField(value: string): string {
  if (!value) return '';
  // Escape quotes and wrap in quotes if field contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Trigger a CSV file download in the browser.
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

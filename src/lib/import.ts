import type { Item } from './types';

export type ImportedItem = Omit<Item, 'id' | 'userId' | 'createdAt'>;

/**
 * Parse a CSV string into importable items.
 * Expects headers: Name, Description, Box ID, Location, Tags, Created At
 * Tags are semicolon-separated.
 */
export function parseCsvToItems(csv: string): { items: ImportedItem[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csv.trim().split('\n');

  if (lines.length < 2) {
    return { items: [], errors: ['CSV file is empty or has no data rows.'] };
  }

  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map((h) => h.toLowerCase().trim());

  const nameIdx = headers.findIndex((h) => h === 'name');
  const descIdx = headers.findIndex((h) => h === 'description');
  const boxIdx = headers.findIndex((h) => h.includes('box'));
  const locIdx = headers.findIndex((h) => h === 'location');
  const tagsIdx = headers.findIndex((h) => h === 'tags');

  if (nameIdx === -1) {
    return { items: [], errors: ['CSV is missing required "Name" column.'] };
  }
  if (boxIdx === -1) {
    return { items: [], errors: ['CSV is missing required "Box ID" column.'] };
  }

  const items: ImportedItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const fields = parseCsvLine(line);
      const name = fields[nameIdx]?.trim();
      const boxId = fields[boxIdx]?.trim();

      if (!name) {
        errors.push(`Row ${i + 1}: Missing item name, skipped.`);
        continue;
      }
      if (!boxId) {
        errors.push(`Row ${i + 1}: Missing box ID, skipped.`);
        continue;
      }

      const tagsRaw = tagsIdx >= 0 ? fields[tagsIdx]?.trim() : '';
      const tags = tagsRaw
        ? tagsRaw.split(';').map((t) => t.trim()).filter(Boolean)
        : [];

      items.push({
        name,
        description: descIdx >= 0 ? fields[descIdx]?.trim() || '' : '',
        boxId,
        location: locIdx >= 0 ? fields[locIdx]?.trim() || '' : '',
        imageUrl: '',
        tags: tags.length > 0 ? tags : undefined,
      });
    } catch {
      errors.push(`Row ${i + 1}: Failed to parse, skipped.`);
    }
  }

  return { items, errors };
}

/**
 * Parse a single CSV line respecting quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Validate imported items and return summary stats.
 */
export function validateImport(items: ImportedItem[]): {
  totalItems: number;
  uniqueBoxes: number;
  uniqueLocations: number;
  uniqueTags: string[];
} {
  const boxes = new Set(items.map((i) => i.boxId));
  const locations = new Set(items.filter((i) => i.location).map((i) => i.location));
  const tags = new Set(items.flatMap((i) => i.tags ?? []));

  return {
    totalItems: items.length,
    uniqueBoxes: boxes.size,
    uniqueLocations: locations.size,
    uniqueTags: [...tags].sort(),
  };
}

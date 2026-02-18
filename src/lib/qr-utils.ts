/**
 * Extract a box GUID/UUID from QR code data.
 * Handles raw UUIDs, URLs containing UUIDs, or general alphanumeric IDs.
 */
export function extractBoxId(data: string): string | null {
  const trimmed = data.trim();
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  // Try to extract UUID from anywhere in the string (e.g. URL like https://app.com/box/uuid-here)
  const uuidMatch = trimmed.match(uuidPattern);
  if (uuidMatch) return uuidMatch[0];

  // Accept any alphanumeric ID longer than 3 chars as fallback
  const generalPattern = /^[a-zA-Z0-9_-]{3,}$/;
  if (generalPattern.test(trimmed)) return trimmed;

  return null;
}

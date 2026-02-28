/**
 * Format a date relative to now (e.g., "2 hours ago", "yesterday", "3 days ago").
 */
export function formatRelativeDate(date: Date, now = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

/**
 * Truncate a UUID for display (e.g., "123e4567...4000").
 */
export function truncateUuid(uuid: string, startChars = 8, endChars = 4): string {
  if (uuid.length <= startChars + endChars + 3) return uuid;
  return `${uuid.slice(0, startChars)}...${uuid.slice(-endChars)}`;
}

/**
 * Pluralize a word based on count.
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

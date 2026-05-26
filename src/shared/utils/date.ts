/**
 * Returns a date string in YYYY-MM-DD format for the local timezone.
 * Defaults to the current date if no date is provided.
 */
export function getLocalIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

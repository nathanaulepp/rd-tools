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

/**
 * Formats age in days into a human-readable string with appropriate granularity.
 * - < 7 days: "X days"
 * - < 30 days: "X weeks, Y days"
 * - < 2 years: "X months" (includes weeks if < 1 year)
 * - >= 2 years: "X years, Y months"
 */
export function formatAge(ageDays: number): string {
  if (ageDays < 0) return "--";

  if (ageDays < 7) {
    return `${ageDays} day${ageDays !== 1 ? "s" : ""}`;
  } 
  
  if (ageDays < 30) {
    const weeks = Math.floor(ageDays / 7);
    const days = Math.floor(ageDays % 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""}${
      days > 0 ? `, ${days} day${days !== 1 ? "s" : ""}` : ""
    }`;
  } 
  
  if (ageDays < 730) {
    const months = Math.floor(ageDays / 30.4375);
    const remainingDays = ageDays % 30.4375;
    const weeks = Math.floor(remainingDays / 7);
    
    if (months < 12 && weeks > 0) {
      return `${months} month${months !== 1 ? "s" : ""}, ${weeks} week${
        weeks !== 1 ? "s" : ""
      }`;
    }
    return `${months} month${months !== 1 ? "s" : ""}`;
  }

  const years = Math.floor(ageDays / 365.25);
  const remainingDays = ageDays % 365.25;
  const months = Math.floor(remainingDays / 30.4375);
  return `${years} year${years !== 1 ? "s" : ""}${
    months > 0 ? `, ${months} month${months !== 1 ? "s" : ""}` : ""
  }`;
}

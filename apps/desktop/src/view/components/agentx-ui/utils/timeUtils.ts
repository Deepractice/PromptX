/**
 * Format a date as relative time (e.g., "Just now", "5 mins ago", "2 hours ago")
 *
 * @param dateString - ISO date string or Date object
 * @param currentTime - Current time for comparison (defaults to now)
 * @returns Formatted relative time string
 *
 * @example
 * ```ts
 * formatTimeAgo("2025-01-14T10:30:00Z") // "5 mins ago"
 * formatTimeAgo(new Date()) // "Just now"
 * ```
 */
export function formatTimeAgo(dateString: string | Date, currentTime: Date = new Date()): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return "Unknown";
  }

  const diffInMs = currentTime.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInSeconds < 60) return "Just now";
  if (diffInMinutes === 1) return "1 min ago";
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  if (diffInHours === 1) return "1 hour ago";
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
}

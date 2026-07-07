/**
 * Purpose: Pure view helpers for the notifications screen — derive a category
 *   from a notification's navigation target, filter by the chip row, and bucket
 *   into Today/Earlier. No React/RN imports so the node jest lane can test it.
 * Why important: The screen filters and groups an in-memory feed; doing it in
 *   latent space would let the mapping drift. This module is the deterministic
 *   source of truth the screen renders from.
 * Used by: screens/ExploreScreens.tsx and __tests__/notification-view.test.ts.
 */

/** Only the target route matters for categorising; matches NotificationRecord. */
export type NotificationTargetLike = { route: string };
export type NotificationLike = { time: string; target: NotificationTargetLike };

export type NotificationCategory = 'unlocks' | 'payments' | 'listings' | 'other';
export type NotificationFilter = 'all' | 'unlocks' | 'payments' | 'listings';

/** The chips shown above the feed, in order. */
export const notificationFilters: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unlocks', label: 'Unlocks' },
  { key: 'payments', label: 'Payments' },
  { key: 'listings', label: 'Listings' },
];

/** Map a notification's target route to a chip category. */
export function notificationCategory(target: NotificationTargetLike): NotificationCategory {
  switch (target.route) {
    case 'confirmations':
      return 'unlocks';
    case 'credits':
      return 'payments';
    case 'my-listings':
    case 'listing':
      return 'listings';
    default:
      return 'other';
  }
}

/** Filter by chip. 'all' is identity; other keys match the derived category. */
export function filterNotifications<T extends NotificationLike>(
  notifications: T[],
  filter: NotificationFilter,
): T[] {
  if (filter === 'all') return notifications;
  return notifications.filter((notification) => notificationCategory(notification.target) === filter);
}

/**
 * Bucket by the relative `time` string. Anything that reads as days/yesterday
 * lands in "Earlier"; everything else (minutes/hours/"Just now") is "Today".
 */
export function notificationDayBucket(time: string): 'Today' | 'Earlier' {
  return /(\byesterday\b|\bday(s)?\b|\d+\s*d\b)/i.test(time) ? 'Earlier' : 'Today';
}

/** Group into Today then Earlier sections, dropping any empty section. */
export function groupNotificationsByDay<T extends NotificationLike>(
  notifications: T[],
): { day: 'Today' | 'Earlier'; items: T[] }[] {
  const today = notifications.filter((n) => notificationDayBucket(n.time) === 'Today');
  const earlier = notifications.filter((n) => notificationDayBucket(n.time) === 'Earlier');
  const groups: { day: 'Today' | 'Earlier'; items: T[] }[] = [];
  if (today.length) groups.push({ day: 'Today', items: today });
  if (earlier.length) groups.push({ day: 'Earlier', items: earlier });
  return groups;
}

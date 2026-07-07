import {
  filterNotifications,
  groupNotificationsByDay,
  notificationCategory,
  notificationDayBucket,
  notificationFilters,
  type NotificationLike,
} from '../notification-view';

describe('notification-view', () => {
  const feed: NotificationLike[] = [
    { time: '2m', target: { route: 'listing' } },
    { time: '1h', target: { route: 'credits' } },
    { time: '4h', target: { route: 'confirmations' } },
    { time: '1d', target: { route: 'my-listings' } },
    { time: 'Yesterday', target: { route: 'profile' } },
  ];

  it('exposes four chips with All first', () => {
    expect(notificationFilters.map((c) => c.key)).toEqual(['all', 'unlocks', 'payments', 'listings']);
  });

  it('maps target routes to categories', () => {
    expect(notificationCategory({ route: 'confirmations' })).toBe('unlocks');
    expect(notificationCategory({ route: 'credits' })).toBe('payments');
    expect(notificationCategory({ route: 'my-listings' })).toBe('listings');
    expect(notificationCategory({ route: 'listing' })).toBe('listings');
    expect(notificationCategory({ route: 'profile' })).toBe('other');
  });

  it('filters by chip and treats all as identity', () => {
    expect(filterNotifications(feed, 'all')).toHaveLength(5);
    expect(filterNotifications(feed, 'payments').map((n) => n.time)).toEqual(['1h']);
    expect(filterNotifications(feed, 'listings').map((n) => n.time)).toEqual(['2m', '1d']);
    expect(filterNotifications(feed, 'unlocks').map((n) => n.time)).toEqual(['4h']);
  });

  it('buckets relative times into Today/Earlier', () => {
    expect(notificationDayBucket('2m')).toBe('Today');
    expect(notificationDayBucket('4h')).toBe('Today');
    expect(notificationDayBucket('Just now')).toBe('Today');
    expect(notificationDayBucket('1d')).toBe('Earlier');
    expect(notificationDayBucket('3 days ago')).toBe('Earlier');
    expect(notificationDayBucket('Yesterday')).toBe('Earlier');
  });

  it('groups Today then Earlier and drops empty sections', () => {
    const groups = groupNotificationsByDay(feed);
    expect(groups.map((g) => g.day)).toEqual(['Today', 'Earlier']);
    expect(groups[0].items).toHaveLength(3);
    expect(groups[1].items).toHaveLength(2);

    const onlyToday = groupNotificationsByDay([{ time: '2m', target: { route: 'credits' } }]);
    expect(onlyToday.map((g) => g.day)).toEqual(['Today']);
  });
});

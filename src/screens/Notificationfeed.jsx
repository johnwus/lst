import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Notificationfeed.css';

const TYPE_META = {
  reply: { label: 'Reply', colorClass: 'notifItem--reply' },
  mention: { label: 'Mention', colorClass: 'notifItem--mention' },
  trending: { label: 'Trending', colorClass: 'notifItem--trending' },
};

const initialNotifications = [
  {
    id: 1,
    type: 'reply',
    title: 'New reply on your thread',
    body: '“Thanks for starting this conversation!”',
    topic: 'Community check‑in',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 2,
    type: 'mention',
    title: 'You were mentioned',
    body: '@christ_user invited you to join the thread',
    topic: 'Side projects for 2026',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 3,
    type: 'trending',
    title: 'Your reply is trending',
    body: 'Your take is getting a lot of reactions.',
    topic: 'Future of remote work',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 4,
    type: 'reply',
    title: 'New reply in followed topic',
    body: 'Someone added a new perspective.',
    topic: 'Learning in public',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function NotificationItem({ notification, onClick }) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.reply;
  const containerClass = [
    'notifItem',
    meta.colorClass,
    notification.read ? 'notifItemRead' : 'notifItemUnread',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={containerClass} onClick={onClick}>
      <div className="notifItemHeader">
        <span className="notifItemType">{meta.label}</span>
        <span className="notifItemTopic">{notification.topic}</span>
      </div>
      <div className="notifItemTitle">{notification.title}</div>
      <div className="notifItemBody">{notification.body}</div>
    </button>
  );
}

function NotificationSection({ label, items, onItemClick }) {
  if (!items.length) return null;

  return (
    <section className="notifSection" aria-label={label}>
      <div className="notifSectionHeader">{label}</div>
      <div className="notifList" role="list">
        {items.map((n) => (
          <div key={n.id} role="listitem">
            <NotificationItem notification={n} onClick={() => onItemClick(n.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function NotificationFeed() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const navigate = useNavigate();

  const { todayItems, yesterdayItems, todayDate, yesterdayDate } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    const today = [];
    const yesterday = [];

    for (const n of notifications) {
      const ts = startOfDay(n.createdAt);
      if (ts === todayStart) {
        today.push(n);
      } else if (ts === yesterdayStart) {
        yesterday.push(n);
      }
    }

    const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

    const formatDate = (timestamp) => {
      const d = new Date(timestamp);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return {
      todayItems: today.sort(byNewest),
      yesterdayItems: yesterday.sort(byNewest),
      todayDate: formatDate(todayStart),
      yesterdayDate: formatDate(yesterdayStart),
    };
  }, [notifications]);

  const hasUnread = notifications.some((n) => !n.read);

  function handleMarkAllRead() {
    if (!hasUnread) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleItemClick(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <div className="notifShell">
      <header className="notifTopbar">
        <button
          type="button"
          className="notifBackBtn"
          onClick={() => navigate('/')}
        >
          ←
        </button>
        <div className="notifTopbarTitle">Notifications</div>
        <button
          type="button"
          className="notifMarkAllBtn"
          onClick={handleMarkAllRead}
          disabled={!hasUnread}
        >
          Mark all as read
        </button>
      </header>

      <main className="notifMain">
        <NotificationSection
          label={`TODAY • ${todayDate}`}
          items={todayItems}
          onItemClick={handleItemClick}
        />
        <NotificationSection
          label={`YESTERDAY • ${yesterdayDate}`}
          items={yesterdayItems}
          onItemClick={handleItemClick}
        />

        {!todayItems.length && !yesterdayItems.length ? (
          <div className="notifEmpty">no message</div>
        ) : null}
      </main>
    </div>
  );
}

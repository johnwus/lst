import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Layout from '../components/Layout';
import Avatar from '../components/Avatar';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { 
  useNotifications, 
  useMarkNotificationsRead, 
  useMarkNotificationRead,
  useDeleteNotification,
  useClearAllNotifications 
} from '../hooks/useQueries';
import { 
  MessageCircle, 
  Reply, 
  UserPlus, 
  Heart, 
  Shield, 
  ThumbsUp,
  Smile,
  HelpCircle,
  Lightbulb,
  ChevronRight,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  RotateCw
} from 'lucide-react';

// Icon mapping for each notification type with proper lucide-react icons
const NOTIF_ICONS = {
  mention: { 
    icon: MessageCircle, 
    color: 'bg-sky-500/20 text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30'
  },
  reply: { 
    icon: Reply, 
    color: 'bg-purple-500/20 text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  follow: { 
    icon: UserPlus, 
    color: 'bg-emerald-500/20 text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  system: { 
    icon: Shield, 
    color: 'bg-gray-500/20 text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30'
  },
  reaction: { 
    icon: Heart, 
    color: 'bg-pink-500/20 text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30'
  },
};

// Reaction type icons mapping
const REACTION_ICONS = {
  like: { icon: ThumbsUp, label: 'liked' },
  love: { icon: Heart, label: 'loved' },
  funny: { icon: Smile, label: 'found funny' },
  curious: { icon: HelpCircle, label: 'is curious about' },
  insightful: { icon: Lightbulb, label: 'found insightful' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function groupByDay(notifications) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = {};
  for (const n of notifications) {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);
    let label;
    if (d >= today) label = 'TODAY';
    else if (d >= yesterday) label = 'YESTERDAY';
    else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return groups;
}

function NotificationItem({ notification, onClick, onRead, onDelete }) {
  const { icon: Icon, color, bgColor, borderColor } = NOTIF_ICONS[notification.type] || NOTIF_ICONS.system;
  const hasLink = notification.link && notification.link.length > 0;
  const isNew = !notification.isRead;
  
  // For reaction notifications, extract the reaction type from the message
  let reactionInfo = null;
  if (notification.type === 'reaction') {
    const reactionMatch = notification.message?.match(/reacted to your message with (\w+)/);
    if (reactionMatch) {
      const reactionType = reactionMatch[1];
      reactionInfo = REACTION_ICONS[reactionType] || REACTION_ICONS.like;
    }
  }
  
  const ReactionIcon = reactionInfo?.icon || Heart;
  const reactionLabel = reactionInfo?.label || 'reacted to';

  return (
    <div
      onClick={onClick}
      className={`
        group relative flex items-start gap-3 px-4 py-3 
        border-b border-white/5 transition-all duration-200 cursor-pointer
        ${isNew ? 'bg-purple-900/10' : 'hover:bg-white/5'}
        min-h-[72px]
      `}
    >
      {/* Unread indicator bar */}
      {isNew && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-r-full" />
      )}
      
      {/* Icon container */}
      <div className={`
        relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
        ${bgColor} ${borderColor} border
        group-hover:scale-110 transition-transform duration-200
      `}>
        {notification.type === 'reaction' ? (
          <ReactionIcon className={`w-5 h-5 ${color}`} />
        ) : (
          <Icon className={`w-5 h-5 ${color}`} />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm leading-relaxed pr-8">
          {notification.type === 'reaction' ? (
            <span>
              <span className="text-pink-400 font-medium">@{notification.sender?.username || 'Someone'}</span>
              {' '}{reactionLabel}{' '}
              <span className="text-gray-300">your message</span>
            </span>
          ) : (
            <span className={isNew ? 'font-medium' : 'text-gray-300'}>{notification.message}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-gray-500 text-xs">{timeAgo(notification.createdAt)}</div>
          {isNew && (
            <span className="text-purple-400 text-[10px] font-bold uppercase tracking-wider">New</span>
          )}
        </div>
      </div>

      {/* Actions tray - visible on hover or if isNew */}
      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
        {isNew && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead();
            }}
            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-full transition-colors"
            title="Mark as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {hasLink && (
          <div className="p-2 text-gray-500">
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);

  // Use TanStack Query for notifications
  const { data: notifications = [], isLoading, refetch } = useNotifications();

  // Notification mutations
  const markAllReadMutation = useMarkNotificationsRead();
  const markOneReadMutation = useMarkNotificationRead();
  const deleteMutation = useDeleteNotification();
  const clearAllMutation = useClearAllNotifications();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (notification) => {
      console.log('[Notifications] New notification received via socket:', notification);
      refetch();
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [refetch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleClearAll = async () => {
    if (window.confirm("Clear all notifications? This cannot be undone.")) {
      try {
        await clearAllMutation.mutateAsync();
      } catch (err) {
        console.error("Failed to clear notifications:", err);
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    // 1. Mark as read immediately if unread
    if (!notification.isRead) {
      markOneReadMutation.mutate(notification._id);
    }

    // 2. Handle navigation
    if (notification.type === 'follow') {
      const userId = notification.sender?._id || notification.sender?.id;
      if (userId) {
        setSelectedProfileUserId(userId);
        return;
      }
    }

    if (notification.link && notification.link.length > 0) {
      setLocation(notification.link);
    }
  };

  const groups = groupByDay(notifications);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const notifIcon = (
    <div className="relative">
      <Bell className="w-5 h-5 text-purple-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full" />
      )}
    </div>
  );

  const notifSubtitle = unreadCount > 0 && (
    <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">
      {unreadCount} new
    </span>
  );

  const rightActions = notifications.length > 0 && (
    <div className="flex items-center gap-1">
      <button 
        onClick={handleClearAll}
        className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/5"
        title="Clear all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <button 
        onClick={() => markAllReadMutation.mutate()}
        className="text-gray-400 hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-white/5"
        title="Mark all as read"
      >
        <CheckCheck className="w-4 h-4" />
      </button>
      <button 
        onClick={handleRefresh}
        disabled={refreshing}
        className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
        title="Refresh"
      >
        <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );

  return (
    <Layout
      headerProps={{
        icon: notifIcon,
        title: 'Notifications',
        subtitle: notifSubtitle,
        rightElement: rightActions,
      }}
    >
      <div className="flex-1 overflow-y-auto min-h-0 w-full relative mb-5">
        {/* Content */}
        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
              <BellOff className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-white font-bold mb-2">Stay in the loop</h3>
            <p className="text-gray-400 text-sm mb-6">Sign in to see your notifications</p>
            <button 
              onClick={() => setLocation('/auth')} 
              className="bg-gradient-to-r from-purple-600 to-green-500 text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Sign In
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm mt-3">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gray-800/30 flex items-center justify-center mb-4">
              <BellOff className="w-12 h-12 text-gray-600" />
            </div>
            <div className="text-white font-medium mb-1">All caught up!</div>
            <div className="text-gray-500 text-sm">No new notifications</div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {Object.entries(groups).map(([label, items]) => (
              <div key={label}>
                <div className={`
                  px-4 py-2 text-xs font-bold tracking-wider uppercase
                  ${label === 'TODAY' ? 'bg-purple-900/10 text-purple-400' : 'text-gray-500'}
                `}>
                  {label}
                  <span className="ml-2 text-gray-600">{items.length}</span>
                </div>
                {items.map(notification => (
                  <NotificationItem 
                    key={notification._id} 
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onRead={() => markOneReadMutation.mutate(notification._id)}
                    onDelete={() => deleteMutation.mutate(notification._id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedProfileUserId && (
        <UserProfileModal
          userId={selectedProfileUserId}
          onClose={() => setSelectedProfileUserId(null)}
        />
      )}
    </Layout>
  );
}

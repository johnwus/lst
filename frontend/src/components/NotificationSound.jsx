import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { playNotificationSound, playMessageSound, initNotificationSound } from '../lib/sounds';
import { useAuth } from '../context/AuthContext';

/**
 * Global component that listens for socket notifications and plays a sound.
 * Add this to App.jsx to ensure it's always active.
 */
export default function NotificationSound() {
  const { user } = useAuth();
  
  useEffect(() => {
    // Initialize on mount
    initNotificationSound();
  }, []);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    // Handle high-priority direct notifications (mentions, replies, follows)
    const handleNewNotification = (notification) => {
      try {
        if (!notification || user.soundNotifications === false) return;
        const priorityTypes = ['mention', 'reply', 'follow'];
        if (priorityTypes.includes(notification.type)) {
          playNotificationSound();
        }
      } catch (e) {
        // Safe fail
      }
    };

    // Handle standard room/thread messages
    const handleInRoomMessage = (msg) => {
      try {
        if (!msg || user.soundNotifications === false) return;
        // Don't play for our own messages
        const isOwn = user.id === (msg.author?._id || msg.author?.id);
        if (!isOwn) {
          playMessageSound();
        }
      } catch (e) {
        // Safe fail
      }
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('message', handleInRoomMessage);
    socket.on('thread_message', handleInRoomMessage);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('message', handleInRoomMessage);
      socket.off('thread_message', handleInRoomMessage);
    };
  }, [user]);

  return null; // Invisible component
}

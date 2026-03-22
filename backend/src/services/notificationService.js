import webpush from 'web-push';
import User from '../models/User.js';
import { getIo, onlineUsers } from '../socket.js';

// Configure Web Push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:misterghod@gmail.com', // Replace with your contact email
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Handles real-time delivery of notifications via Socket.io and Web Push
 * @param {Object} notification - The saved Notification document
 */
export async function sendNotification(notification) {
  try {
    const recipientId = notification.recipient.toString();
    
    // 1. Deliver via Socket.io if user is online
    const socketId = onlineUsers.get(recipientId);
    if (socketId) {
      const io = getIo();
      if (io) {
        io.to(socketId).emit('new_notification', notification);
        console.log(`[NotificationService] Delivered via Socket to user ${recipientId}`);
      }
    }

    // 2. Deliver via Web Push
    const user = await User.findById(recipientId);
    if (!user || !user.pushNotifications || !user.pushSubscriptions?.length) {
      return;
    }

    const payload = JSON.stringify({
      title: 'New Notification',
      body: notification.message,
      icon: '/icon-192.png', // Corrected path to public asset
      data: {
        link: notification.link,
        notificationId: notification._id
      }
    });

    console.log(`[NotificationService] Sending Web Push to ${user.pushSubscriptions.length} devices for user ${recipientId}`);

    // Send to all registered devices for this user
    const pushPromises = user.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription has expired or is no longer valid, remove it
          console.log(`[NotificationService] Removing expired subscription for user ${recipientId}`);
          await User.findByIdAndUpdate(recipientId, {
            $pull: { pushSubscriptions: { endpoint: sub.endpoint } }
          });
        } else {
          console.error('[NotificationService] Web Push individual error:', err);
        }
      }
    });

    await Promise.all(pushPromises);
    
  } catch (err) {
    console.error('[NotificationService] Global Error:', err);
  }
}

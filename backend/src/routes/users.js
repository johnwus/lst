import { Router } from 'express';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendNotification } from '../services/notificationService.js';

const router = Router();

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
      ],
    }).select('username displayName avatarInitials avatarColor isOnline').limit(20);
    res.json(users.map(u => ({
      id: u._id, username: u.username, displayName: u.displayName,
      avatarInitials: u.avatarInitials, avatarColor: u.avatarColor, isOnline: u.isOnline,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toPublicJSON());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Can't follow yourself" });
    }
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user.id);
    if (!target || !me) return res.status(404).json({ error: 'User not found' });

    const alreadyFollowing = me.following.includes(target._id);
    if (alreadyFollowing) {
      me.following.pull(target._id);
      target.followers.pull(me._id);
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
      const notification = await Notification.create({
        recipient: target._id,
        sender: me._id,
        type: 'follow',
        message: `@${me.username} started following you`,
        link: `/profile/${me.username}`,
      });

      // Deliver notification via service (Socket + Web Push) - Non-blocking
      sendNotification(notification);
    }
    await me.save();
    await target.save();
    res.json({ following: !alreadyFollowing });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/following-status', authenticateToken, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const isFollowing = me.following.includes(req.params.id);
    res.json({ isFollowing });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Push Notification Routes
router.get('/settings/push-public-key', authenticateToken, (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/settings/push-subscription', authenticateToken, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription is required' });
    }
    
    // Add subscription if it doesn't exist for this user
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { pushSubscriptions: subscription }
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/settings/sound-enabled', authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Enabled status must be a boolean' });
    }
    
    await User.findByIdAndUpdate(req.user.id, {
      soundNotifications: enabled
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/settings/push-enabled', authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Enabled status must be a boolean' });
    }
    
    await User.findByIdAndUpdate(req.user.id, { pushNotifications: enabled });
    res.json({ success: true, enabled });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

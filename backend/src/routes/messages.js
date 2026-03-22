import { Router } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendNotification } from '../services/notificationService.js';
import { getIo } from '../socket.js';

const router = Router();

router.get('/topic/:topicId', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const query = {
      topicId: req.params.topicId,
      parentMessageId: null,
      isDeleted: false,
    };
    if (before) query.createdAt = { $lt: new Date(before) };
    const messages = await Message.find(query)
      .populate('author', 'username displayName avatarInitials avatarColor isAdmin')
      .populate('parentMessageId', 'content author')
      .populate('parentMessageId.author', 'username displayName avatarInitials avatarColor isAdmin')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/topic/:topicId/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const searchRegex = new RegExp(q.trim(), 'i');
    const messages = await Message.find({
      topicId: req.params.topicId,
      content: searchRegex,
      isDeleted: false,
    })
      .populate('author', 'username displayName avatarInitials avatarColor isAdmin')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(messages);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/global', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const query = { isGlobal: true, parentMessageId: null, isTopicCard: { $ne: true }, isDeleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };
    const messages = await Message.find(query)
      .select('content author parentMessageId originalMessageId threadId isThread isTopicCard reactions replyCount isDeleted editedAt createdAt')
      .populate('author', 'username displayName avatarInitials avatarColor isAdmin')
      .populate('parentMessageId', 'content author')
      .populate('parentMessageId.author', 'username displayName avatarInitials avatarColor isAdmin')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/thread/:messageId', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const messages = await Message.find({
      $or: [
        { parentMessageId: messageId },
        { originalMessageId: messageId }
      ],
      isDeleted: false,
    })
      .populate('author', 'username displayName avatarInitials avatarColor isAdmin')
      .populate('parentMessageId', 'content author')
      .populate('parentMessageId.author', 'username displayName avatarInitials avatarColor isAdmin')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:messageId', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
      .populate('author', 'username displayName avatarInitials avatarColor isAdmin')
      .populate('topicId', 'title category description expiresAt imageUrl messageCount participantCount');
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(message);
  } catch (err) {
    console.error('Error fetching message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/thread/:messageId/participants', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    const participantIds = await Message.distinct('author', {
      $or: [
        { _id: messageId },
        { parentMessageId: messageId },
        { originalMessageId: messageId }
      ],
      isDeleted: false,
    });
    const participants = await User.find({ _id: { $in: participantIds } })
      .select('username displayName avatarInitials avatarColor isOnline');
    res.json(participants);
  } catch (err) {
    console.error('Error getting thread participants:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user-threads/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Step 1: Collect all root IDs from the user's messages in one lean query
    const userMsgs = await Message.find({ author: userId, isDeleted: false })
      .select('_id parentMessageId originalMessageId')
      .lean();

    const rootIdsSet = new Set();
    for (const msg of userMsgs) {
      if (msg.originalMessageId) {
        rootIdsSet.add(msg.originalMessageId.toString());
      } else if (msg.parentMessageId) {
        rootIdsSet.add(msg.parentMessageId.toString());
      } else {
        rootIdsSet.add(msg._id.toString());
      }
    }

    const rootIds = Array.from(rootIdsSet);
    if (rootIds.length === 0) {
      return res.json([]);
    }

    const rootObjectIds = rootIds.map((id) => new mongoose.Types.ObjectId(id));

    console.log(`[DEBUG] User ${userId} participates in ${rootIds.length} thread roots`);

    // Step 2: Single aggregation to get reply counts for ALL roots at once.
    // This replaces the previous N sequential countDocuments calls (one per root)
    // which was the cause of the 7-minute response time.
    const replyCounts = await Message.aggregate([
      {
        $match: {
          isDeleted: false,
          $or: [
            { parentMessageId: { $in: rootObjectIds } },
            { originalMessageId: { $in: rootObjectIds } },
          ],
        },
      },
      {
        $project: {
          rootId: {
            $ifNull: ['$originalMessageId', '$parentMessageId'],
          },
        },
      },
      {
        $group: {
          _id: '$rootId',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(replyCounts.map((r) => [r._id.toString(), r.count]));

    // Step 3: Filter to only roots with replies (or isTopicCard) — fetch candidates first
    const candidates = await Message.find({
      _id: { $in: rootObjectIds },
      isDeleted: false,
    })
      .select('_id isTopicCard')
      .lean();

    const activeRootIds = candidates
      .filter((t) => t.isTopicCard || (countMap.get(t._id.toString()) || 0) > 0)
      .map((t) => t._id);

    if (activeRootIds.length === 0) {
      return res.json([]);
    }

    // Step 4: Fetch full thread documents for active roots only
    const threads = await Message.find({
      _id: { $in: activeRootIds },
      isDeleted: false,
    })
      .populate('author', 'username displayName avatarInitials avatarColor')
      .populate('topicId', 'title category')
      .sort({ createdAt: -1 })
      .limit(50);

    // Attach the accurate reply counts from the aggregation
    threads.forEach((t) => {
      t.replyCount = countMap.get(t._id.toString()) || 0;
    });

    console.log(`[DEBUG] Fetched ${threads.length} active thread roots. Authors:`, threads.map((t) => ({ id: t._id, author: t.author?.username, replyCount: t.replyCount })));

    res.json(threads);
  } catch (err) {
    console.error('Error fetching user threads:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, topicId, isGlobal, parentMessageId } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    if (topicId) {
      const topic = await Topic.findById(topicId);
      if (topic && topic.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(topic.expiresAt);
        if (expiresAt < now) {
          return res.status(403).json({ error: 'This topic has ended and is no longer accepting messages' });
        }
      }
    }

    let isThread = !parentMessageId;
    let originalMessageId = null;
    let isTopicCard = false;
    let threadRootId = null;

    if (parentMessageId) {
      const parentMessage = await Message.findById(parentMessageId);
      if (!parentMessage) {
        return res.status(404).json({ error: 'Parent message not found' });
      }

      threadRootId = parentMessage.originalMessageId || parentMessageId;
      originalMessageId = threadRootId;

      if (parentMessage.isGlobal && !parentMessage.isTopicCard && !parentMessage.parentMessageId) {
        await Message.findByIdAndUpdate(parentMessageId, { isTopicCard: true });
        isTopicCard = true;
      } else if (parentMessage.isTopicCard) {
        isTopicCard = true;
      }
    }

    // Pre-generate _id so root messages can reference themselves as threadId
    // inside the constructor — no post-save reassignment needed.
    const newId = new mongoose.Types.ObjectId();

    const message = new Message({
      _id: newId,
      content: content.trim(),
      author: req.user.id,
      topicId: topicId || null,
      isGlobal: isGlobal || false,
      parentMessageId: parentMessageId || null,
      originalMessageId: originalMessageId,
      threadId: parentMessageId ? threadRootId : newId,
      isThread: isThread,
      isTopicCard: isTopicCard,
      reactions: [
        { type: 'like', users: [], count: 0 },
        { type: 'love', users: [], count: 0 },
        { type: 'funny', users: [], count: 0 },
        { type: 'curious', users: [], count: 0 },
        { type: 'insightful', users: [], count: 0 },
      ],
    });

    await message.save();
    await message.populate('author', 'username displayName avatarInitials avatarColor isAdmin');
    await message.populate('parentMessageId', 'content author');
    await message.populate('parentMessageId.author', 'username displayName avatarInitials avatarColor isAdmin');

    if (parentMessageId) {
      const directReplyCount = await Message.countDocuments({ parentMessageId: parentMessageId, isDeleted: false });
      await Message.findByIdAndUpdate(parentMessageId, { replyCount: directReplyCount });

      if (threadRootId) {
        const threadReplyCount = await Message.countDocuments({
          $or: [
            { parentMessageId: threadRootId },
            { originalMessageId: threadRootId }
          ],
          isDeleted: false,
        });
        await Message.findByIdAndUpdate(threadRootId, { replyCount: threadReplyCount });
      }

      try {
        const io = getIo();
        if (io) {
          const parentMsg = await Message.findById(parentMessageId);
          if (parentMsg) {
            const room = parentMsg.isGlobal ? 'global' : parentMsg.topicId ? `topic:${parentMsg.topicId}` : null;
            if (room) {
              io.to(room).emit('reply_count_update', { messageId: parentMessageId, replyCount: directReplyCount });
            }
          }
          if (threadRootId) {
            const rootMsg = await Message.findById(threadRootId);
            if (rootMsg) {
              const room = rootMsg.isGlobal ? 'global' : rootMsg.topicId ? `topic:${rootMsg.topicId}` : null;
              if (room) {
                io.to(room).emit('reply_count_update', { messageId: threadRootId, replyCount: rootMsg.replyCount });
              }
            }
          }
        }
      } catch(e) {}
    }

    if (topicId) {
      await Topic.findByIdAndUpdate(topicId, { $inc: { messageCount: 1 } });
    }

    await User.findByIdAndUpdate(req.user.id, { $inc: { commentCount: 1 } });

    const mentions = content.match(/@(\w+)/g) || [];
    for (const mention of mentions) {
      const mentionedUser = await User.findOne({ username: mention.slice(1) });
      if (mentionedUser && mentionedUser._id.toString() !== req.user.id) {
        let link = '';
        const threadRoot = threadRootId || message._id;
        if (isGlobal) {
          link = `/global?thread=${threadRoot}&messageId=${message._id}`;
        } else if (topicId) {
          link = `/topic/${topicId}?thread=${threadRoot}&messageId=${message._id}`;
        }
        const notification = await Notification.create({
          recipient: mentionedUser._id,
          sender: req.user.id,
          type: 'mention',
          message: `@${req.user.username} mentioned you: "${content.slice(0, 60)}..."`,
          link,
        });

        // Deliver notification via service (Socket + Web Push) - Non-blocking
        sendNotification(notification);
      }
    }

    if (parentMessageId) {
      const parentMessage = await Message.findById(parentMessageId);
      if (parentMessage && parentMessage.author.toString() !== req.user.id) {
        let replyLink = '';
        const threadRoot = threadRootId || parentMessageId;
        if (parentMessage.isGlobal) {
          replyLink = `/global?thread=${threadRoot}&messageId=${message._id}`;
        } else if (parentMessage.topicId) {
          replyLink = `/topic/${parentMessage.topicId}?thread=${threadRoot}&messageId=${message._id}`;
        }
        const notification = await Notification.create({
          recipient: parentMessage.author,
          sender: req.user.id,
          type: 'reply',
          message: `@${req.user.username} replied to your message: "${content.slice(0, 60)}..."`,
          link: replyLink,
        });

        // Deliver notification via service (Socket + Web Push)
        await sendNotification(notification);
      }

      if (originalMessageId && originalMessageId !== parentMessageId) {
        const originalMessage = await Message.findById(originalMessageId);
        if (originalMessage && originalMessage.author.toString() !== req.user.id) {
          let miniRoomLink = '';
          const threadRoot = originalMessageId;
          if (originalMessage.isGlobal) {
            miniRoomLink = `/global?thread=${threadRoot}&messageId=${message._id}`;
          } else if (originalMessage.topicId) {
            miniRoomLink = `/topic/${originalMessage.topicId}?thread=${threadRoot}&messageId=${message._id}`;
          }
          const notification = await Notification.create({
            recipient: originalMessage.author,
            sender: req.user.id,
            type: 'reply',
            message: `@${req.user.username} replied in your thread: "${content.slice(0, 60)}..."`,
            link: miniRoomLink,
          });

          // Deliver notification via service (Socket + Web Push) - Non-blocking
          sendNotification(notification);
        }
      }
    }

    const io = getIo();
    if (io && !parentMessageId) {
      if (isGlobal) {
        io.to('global').emit('message', message);
      } else if (topicId) {
        io.to(`topic:${topicId}`).emit('message', message);
      }
    }

    if (io && parentMessageId && threadRootId) {
      io.to(`thread:${threadRootId}`).emit('thread_message', message);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/react', authenticateToken, async (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['like', 'love', 'funny', 'curious', 'insightful'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid reaction type' });
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    let reaction = message.reactions.find(r => r.type === type);
    let isAddingReaction = false;
    if (!reaction) {
      message.reactions.push({ type, users: [req.user.id], count: 1 });
      isAddingReaction = true;
    } else {
      const idx = reaction.users.indexOf(req.user.id);
      if (idx === -1) {
        reaction.users.push(req.user.id);
        reaction.count += 1;
        isAddingReaction = true;
      } else {
        reaction.users.splice(idx, 1);
        reaction.count -= 1;
      }
    }
    await message.save();

    if (isAddingReaction && message.author.toString() !== req.user.id) {
      let reactionLink = '';
      if (message.isGlobal) {
        const threadRoot = message.originalMessageId || message.parentMessageId || message._id;
        reactionLink = `/global?thread=${threadRoot}&messageId=${message._id}`;
      } else if (message.topicId) {
        const threadRoot = message.originalMessageId || message.parentMessageId || message._id;
        reactionLink = `/topic/${message.topicId}?thread=${threadRoot}&messageId=${message._id}`;
      }
      const sender = await User.findById(req.user.id);
      const notification = await Notification.create({
        recipient: message.author,
        sender: req.user.id,
        type: 'reaction',
        message: `@${sender.username} reacted to your message with ${type}`,
        link: reactionLink,
      });

      // Deliver notification via service (Socket + Web Push) - Non-blocking
      sendNotification(notification);
    }

    // Broadcast reaction update to the room (RESTORED & SYNCHED)
    const io = getIo();
    if (io) {
      const room = message.topicId ? `topic:${message.topicId}` : 'global';
      io.to(room).emit('reaction_update', { 
        messageId: message._id, 
        reactions: message.reactions 
      });

      const threadRootId = message.originalMessageId || message.parentMessageId;
      if (threadRootId) {
        io.to(`thread:${threadRootId}`).emit('reaction_update', { 
          messageId: message._id, 
          reactions: message.reactions 
        });
      }
    }

    res.json(message.reactions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    message.isDeleted = true;
    message.content = '[deleted]';
    await message.save();
    const io = getIo();
    if (io) {
      const room = message.topicId ? `topic:${message.topicId}` : 'global';
      io.to(room).emit('message_deleted', { messageId: message._id });
      const threadRootId = message.originalMessageId || message.parentMessageId;
      if (threadRootId) {
        io.to(`thread:${threadRootId}`).emit('message_deleted', { messageId: message._id });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the message owner can edit' });
    }
    if (message.isDeleted) {
      return res.status(400).json({ error: 'Cannot edit a deleted message' });
    }

    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();
    await message.populate('author', 'username displayName avatarInitials avatarColor isAdmin');
    const io = getIo();
    if (io) {
      const room = message.topicId ? `topic:${message.topicId}` : 'global';
      io.to(room).emit('message_edited', { message });
      const threadRootId = message.originalMessageId || message.parentMessageId;
      if (threadRootId) {
        io.to(`thread:${threadRootId}`).emit('message_edited', { message });
      }
    }
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/report', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'Report reason is required' });

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.reportedBy && message.reportedBy.includes(req.user.id)) {
      return res.status(400).json({ error: 'You have already reported this message' });
    }
    if (message.author.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot report your own message' });
    }

    message.reportReason = reason.trim();
    if (!message.reportedBy) {
      message.reportedBy = [];
    }
    message.reportedBy.push(req.user.id);
    await message.save();

    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/mini-room/:messageId', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const messageId = req.params.messageId;

    const topicCard = await Message.findById(messageId);
    if (!topicCard) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const query = {
      $or: [
        { parentMessageId: messageId },
        { originalMessageId: messageId }
      ],
      isDeleted: false,
    };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .select('content author parentMessageId originalMessageId threadId isThread isTopicCard reactions replyCount isDeleted editedAt createdAt')
      .populate('author', 'username displayName avatarInitials avatarColor isAdmin')
      .populate('parentMessageId', 'content author createdAt')
      .populate('parentMessageId.author', 'username displayName avatarInitials avatarColor')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ topicCard, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/topic-cards', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const topicCards = await Message.find({
      isGlobal: true,
      isTopicCard: true,
      isDeleted: false,
    })
      .populate('author', 'username displayName avatarInitials avatarColor isAdmin')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(topicCards);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/global/stats', authenticateToken, async (req, res) => {
  try {
    const participantCount = await Message.distinct('author', {
      isGlobal: true,
      parentMessageId: null,
      isDeleted: false,
    });
    const messageCount = await Message.countDocuments({
      isGlobal: true,
      parentMessageId: null,
      isDeleted: false,
    });
    res.json({
      participantCount: participantCount.length,
      messageCount,
    });
  } catch (err) {
    console.error('Error getting global room stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/mini-room/:messageId/participants', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const topicCard = await Message.findById(messageId);
    if (!topicCard) {
      return res.status(404).json({ error: 'Mini room not found' });
    }
    const participantIds = await Message.distinct('author', {
      $or: [
        { _id: messageId },
        { parentMessageId: messageId }
      ],
      isDeleted: false,
    });
    const participants = await User.find({ _id: { $in: participantIds } })
      .select('username displayName avatarInitials avatarColor isOnline');
    res.json(participants);
  } catch (err) {
    console.error('Error getting mini room participants:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/mini-room/:messageId/stats', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const topicCard = await Message.findById(messageId);
    if (!topicCard) {
      return res.status(404).json({ error: 'Mini room not found' });
    }
    const participantCount = await Message.distinct('author', {
      $or: [
        { _id: messageId },
        { parentMessageId: messageId }
      ],
      isDeleted: false,
    });
    const messageCount = await Message.countDocuments({
      $or: [
        { _id: messageId },
        { parentMessageId: messageId }
      ],
      isDeleted: false,
    });
    res.json({
      participantCount: participantCount.length,
      messageCount,
    });
  } catch (err) {
    console.error('Error getting mini room stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
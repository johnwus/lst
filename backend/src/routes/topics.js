import { Router } from 'express';
import Topic from '../models/Topic.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 20, offset = 0 } = req.query;
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    
    const now = new Date();
    const topics = await Topic.find(query)
      .populate('createdBy', 'username displayName avatarInitials avatarColor')
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const enriched = topics.map(t => {
      const obj = t.toJSON();
      if (t.expiresAt && t.expiresAt < now) {
        obj.isLive = false;
        obj.timeLeft = 'Ended';
      } else if (t.expiresAt) {
        const diff = t.expiresAt - now;
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        obj.timeLeft = hours > 0 ? `${hours}hr left` : `${mins}m left`;
      }
      return obj;
    });
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/global', async (req, res) => {
  try {
    const twentySevenHoursAgo = new Date(Date.now() - 27 * 60 * 60 * 1000);
    let topic = await Topic.findOne({ 
      isGlobal: true, 
      createdAt: { $gt: twentySevenHoursAgo } 
    }).sort({ createdAt: -1 });

    if (!topic) {
      // If none active, find the absolute latest global topic regardless of age
      topic = await Topic.findOne({ isGlobal: true }).sort({ createdAt: -1 });
    }

    if (!topic) {
      const adminUser = await User.findOne({ isAdmin: true });
      topic = await Topic.create({
        title: 'Global Chat Room',
        description: 'Welcome to the Global Chat. Every topic runs for 27 hours. Replies are public, threads and reportable. Be kind; disagree with ideas and not people.',
        category: 'Society',
        isGlobal: true,
        isLive: true,
        createdBy: adminUser?._id || new mongoose.Types.ObjectId(),
      });
    }
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const topics = await Topic.find({ isLive: true, isGlobal: false })
      .populate('createdBy', 'username displayName avatarInitials avatarColor')
      .sort({ participantCount: -1, viewCount: -1 })
      .limit(10);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/participants', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate('participants', 'username displayName avatarInitials avatarColor isOnline');
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    res.json(topic.participants);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('createdBy', 'username displayName avatarInitials avatarColor');
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    
    const now = new Date();
    const obj = topic.toJSON();
    if (topic.expiresAt && topic.expiresAt < now) {
      obj.timeLeft = 'Ended';
    } else if (topic.expiresAt) {
      const diff = topic.expiresAt - now;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      obj.timeLeft = hours > 0 ? `${hours}hr left` : `${mins}m left`;
    }
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, emoji } = req.body;
    // Multer handles multipart form data, so booleans like isGlobal come in as strings
    const isGlobal = req.body.isGlobal === 'true' || req.body.isGlobal === true;
    
    if (!title) return res.status(400).json({ error: 'Title is required' });

    // Global Topic Logic
    if (isGlobal) {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Only admins can create global topics' });
      }

      const twentySevenHoursAgo = new Date(Date.now() - 27 * 60 * 60 * 1000);
      const activeGlobal = await Topic.findOne({
        isGlobal: true,
        createdAt: { $gt: twentySevenHoursAgo }
      });

      if (activeGlobal) {
        return res.status(400).json({ error: 'A global topic is already active. Only one global topic allowed per 27 hours.' });
      }
    } else {
      // Regular User Topic Logic
      const user = await User.findById(req.user.id);
      if (!user.isAdmin && (user.followersCount || user.followers?.length || 0) < 1000) {
        return res.status(403).json({ error: 'You need at least 1,000 followers to create a topic.' });
      }
    }

    let imageUrl = req.body.imageUrl || '';
    let imagePublicId = '';
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'topics' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        imageUrl = result.secure_url;
        imagePublicId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ error: 'Image upload failed' });
      }
    }

    const expiresAt = new Date(Date.now() + 27 * 60 * 60 * 1000);
    const topic = new Topic({
      title,
      description,
      category: category || 'Society',
      emoji: emoji || '🌐',
      imageUrl,
      imagePublicId,
      createdBy: req.user.id,
      expiresAt,
      isLive: true,
      isGlobal: !!isGlobal,
    });
    
    await topic.save();
    await topic.populate('createdBy', 'username displayName avatarInitials avatarColor');
    res.status(201).json(topic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    if (topic.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await Topic.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ topicId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    if (!topic.participants.includes(req.user.id)) {
      topic.participants.push(req.user.id);
      topic.participantCount += 1;
      await topic.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

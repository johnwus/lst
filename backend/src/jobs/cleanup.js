import cron from 'node-cron';
import Topic from '../models/Topic.js';
import Message from '../models/Message.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * Stage 1: Mark Expired Topics
 * Runs every hour. 
 * Finds themes where expiresAt < now and sets isLive to false.
 */
export const markExpiredTopics = async () => {
  try {
    const now = new Date();
    const result = await Topic.updateMany(
      { 
        expiresAt: { $lt: now }, 
        isLive: true 
      },
      { 
        $set: { isLive: false } 
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Cleanup] Marked ${result.modifiedCount} topics as expired (isLive: false)`);
    }
  } catch (error) {
    console.error('[Cleanup] Error marking expired topics:', error);
  }
};

/**
 * Stage 2: Selective Purge
 * Runs once a day (at midnight).
 * Purges topics that have been expired for more than 7 days.
 * Keeps threads but deletes general chatter and high-res media.
 */
export const purgeSelective = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Find topics that are isLive: false and expired > 7 days ago, and not already purged
    const topicsToPurge = await Topic.find({
      isLive: false,
      isPurged: false,
      expiresAt: { $lt: sevenDaysAgo }
    });

    if (topicsToPurge.length === 0) return;

    console.log(`[Cleanup] Starting selective purge for ${topicsToPurge.length} topics`);

    for (const topic of topicsToPurge) {
      // 1. Delete associated image from Cloudinary
      if (topic.imagePublicId) {
        try {
          await deleteFromCloudinary(topic.imagePublicId);
          console.log(`[Cleanup] Deleted image for topic: ${topic.title}`);
        } catch (imgError) {
          console.error(`[Cleanup] Failed to delete image for topic ${topic._id}:`, imgError);
        }
      }

      // 2. Selective Message Purge
      // Delete top-level messages that ARE NOT threads and HAVE NO replies
      // Note: According to schema, if it has replies, replyCount > 0.
      // If parentMessageId is null AND threadId is null AND isThread is false AND replyCount is 0
      const msgResult = await Message.deleteMany({
        topicId: topic._id,
        parentMessageId: null,
        threadId: null,
        isThread: false,
        replyCount: 0
      });

      console.log(`[Cleanup] Deleted ${msgResult.deletedCount} general messages for topic: ${topic.title}`);

      // 3. Mark topic as purged and clear media URL
      topic.isPurged = true;
      topic.imageUrl = '';
      topic.imagePublicId = '';
      await topic.save();
    }

    console.log(`[Cleanup] Selective purge completed for ${topicsToPurge.length} topics`);
  } catch (error) {
    console.error('[Cleanup] Error during selective purge:', error);
  }
};

// Initialize Cron Jobs
export const initCleanupJobs = () => {
  // Hourly job: Mark expired topics
  cron.schedule('0 * * * *', markExpiredTopics);
  
  // Daily job: Selective purge at 00:00
  cron.schedule('0 0 * * *', purgeSelective);
  
  console.log('[Cleanup] Automated cleanup jobs initialized (Hourly Mark, Daily Selective Purge)');
};

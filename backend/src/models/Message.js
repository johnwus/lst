import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['like', 'love', 'funny', 'curious', 'insightful'], required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  count: { type: Number, default: 0 },
});

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  isGlobal: { type: Boolean, default: false },
  parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  originalMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  threadId: { type: String, default: null },
  isThread: { type: Boolean, default: false },
  isTopicCard: { type: Boolean, default: false },
  reactions: [reactionSchema],
  replyCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
  reportReason: { type: String, default: null },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ topicId: 1, createdAt: -1 });
messageSchema.index({ parentMessageId: 1, createdAt: 1 });
messageSchema.index({ isGlobal: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);

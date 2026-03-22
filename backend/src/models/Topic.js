import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Society', 'Tech', 'Culture', 'Money', 'Random'],
    default: 'Society',
  },
  emoji: { type: String, default: '🌐' },
  imageUrl: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isGlobal: { type: Boolean, default: false },
  isLive: { type: Boolean, default: true },
  isPurged: { type: Boolean, default: false },
  expiresAt: { type: Date },
  participantCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

topicSchema.virtual('timeLeft').get(function () {
  if (!this.expiresAt) return null;
  const diff = this.expiresAt - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return hours > 0 ? `${hours}hr left` : `${mins}m left`;
});

topicSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Topic', topicSchema);

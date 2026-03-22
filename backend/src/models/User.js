import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  displayName: { type: String, default: '' },
  bio: { type: String, default: 'Digital citizen . undefined' },
  avatarColor: { type: String, default: '#6366f1' },
  avatarInitials: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount: { type: Number, default: 0 },
  pushNotifications: { type: Boolean, default: true },
  soundNotifications: { type: Boolean, default: true },
  pushSubscriptions: [
    {
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  refreshToken: { type: String, default: null },
  refreshTokenExpiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  if (!this.avatarInitials) {
    this.avatarInitials = (this.displayName || this.username).slice(0, 2).toUpperCase();
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    displayName: this.displayName || this.username,
    bio: this.bio,
    avatarColor: this.avatarColor,
    avatarInitials: this.avatarInitials,
    avatarUrl: this.avatarUrl,
    isOnline: this.isOnline,
    isAdmin: this.isAdmin,
    followersCount: this.followers.length,
    followingCount: this.following.length,
    commentCount: this.commentCount,
    pushNotifications: this.pushNotifications,
    soundNotifications: this.soundNotifications,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);

import { Router } from 'express';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, authenticateToken, ACCESS_TOKEN_EXPIRY } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    const user = new User({ username, email, password, displayName: displayName || username, avatarColor });
    await user.save();
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Calculate refresh token expiration (7 days from now)
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Store refresh token in database
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    user.isOnline = true;
    await user.save();
    
    res.status(201).json({ 
      accessToken, 
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: user.toPublicJSON() 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Calculate refresh token expiration (7 days from now)
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Store refresh token in database
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    user.isOnline = true;
    await user.save();
    
    res.json({ 
      accessToken, 
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: user.toPublicJSON() 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify the refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
    
    // Find user and verify stored refresh token matches
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    // Check if refresh token matches and hasn't expired
    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
      // Clear expired refresh token
      user.refreshToken = null;
      user.refreshTokenExpiresAt = null;
      await user.save();
      return res.status(403).json({ error: 'Refresh token expired' });
    }
    
    // Generate new access token
    const accessToken = generateAccessToken(user);
    
    // Optionally rotate refresh token (generate new one for better security)
    // For now, we'll keep the same refresh token until it expires
    
    res.json({ 
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toPublicJSON());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { displayName, bio, pushNotifications } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (displayName !== undefined) {
      user.displayName = displayName;
      user.avatarInitials = displayName.slice(0, 2).toUpperCase();
    }
    if (bio !== undefined) user.bio = bio;
    if (pushNotifications !== undefined) user.pushNotifications = pushNotifications;
    await user.save();
    res.json(user.toPublicJSON());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear refresh token on logout
    await User.findByIdAndUpdate(req.user.id, { 
      isOnline: false,
      refreshToken: null,
      refreshTokenExpiresAt: null
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

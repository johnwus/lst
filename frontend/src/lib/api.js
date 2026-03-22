import { updateSocketToken } from './socket';

let accessToken = localStorage.getItem('lt_token');
let refreshToken = localStorage.getItem('lt_refresh_token');
let tokenExpiresAt = parseInt(localStorage.getItem('lt_token_expires_at'), 10) || null;
let refreshTimer = null;

// Time before expiry to refresh (15 minutes - proactive refresh)
const REFRESH_BUFFER_MS = 15 * 60 * 1000;

function getToken() {
  return accessToken;
}

function getRefreshToken() {
  return refreshToken;
}

function getTokenExpiresAt() {
  return tokenExpiresAt;
}

function isTokenExpired() {
  if (!tokenExpiresAt) return true;
  return Date.now() >= tokenExpiresAt;
}

function isTokenExpiringSoon() {
  if (!tokenExpiresAt) return true;
  return Date.now() >= (tokenExpiresAt - REFRESH_BUFFER_MS);
}

function setTokens(newAccessToken, newRefreshToken, expiresIn) {
  accessToken = newAccessToken;
  if (newAccessToken) {
    localStorage.setItem('lt_token', newAccessToken);
    // Calculate and store expiration timestamp
    const expiresInMs = parseExpiresIn(expiresIn);
    tokenExpiresAt = Date.now() + expiresInMs;
    localStorage.setItem('lt_token_expires_at', tokenExpiresAt.toString());
  } else {
    localStorage.removeItem('lt_token');
    localStorage.removeItem('lt_token_expires_at');
    tokenExpiresAt = null;
  }
  
  if (newRefreshToken) {
    localStorage.setItem('lt_refresh_token', newRefreshToken);
  } else {
    localStorage.removeItem('lt_refresh_token');
  }
}

function clearTokens() {
  accessToken = null;
  refreshToken = null;
  tokenExpiresAt = null;
  localStorage.removeItem('lt_token');
  localStorage.removeItem('lt_refresh_token');
  localStorage.removeItem('lt_token_expires_at');
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

// Schedule token refresh
function scheduleTokenRefresh(expiresIn) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  
  // Parse expiresIn (e.g., '15m' -> 15 minutes)
  const expiresInMs = parseExpiresIn(expiresIn);
  const refreshTime = expiresInMs - REFRESH_BUFFER_MS;
  
  if (refreshTime > 0) {
    refreshTimer = setTimeout(async () => {
      await attemptRefresh();
    }, refreshTime);
  }
}

function parseExpiresIn(expiresIn) {
  if (!expiresIn) return 24 * 60 * 60 * 1000; // Default 24 hours
  
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 24 * 60 * 60 * 1000;
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

// Attempt to refresh the access token
async function attemptRefresh() {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    clearTokens();
    window.location.href = '/auth?reason=session_expired';
    return null;
  }
  
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken })
    });
    
    if (!res.ok) {
      clearTokens();
      window.location.href = '/auth?reason=session_expired';
      return null;
    }
    
    const data = await res.json();
    // Get current refresh token before clearing the timer
    const currentRefreshToken = getRefreshToken();
    // Pass expiresIn to properly track token expiration
    setTokens(data.accessToken, currentRefreshToken, data.expiresIn || '24h'); // Keep existing refresh token
    scheduleTokenRefresh(data.expiresIn || '24h');
    // Update socket with new token
    updateSocketToken(data.accessToken);
    return data.accessToken;
  } catch (err) {
    console.error('Token refresh failed:', err);
    clearTokens();
    window.location.href = '/auth?reason=session_expired';
    return null;
  }
}

async function request(path, options = {}) {
  let token = getToken();
  
  // Proactively refresh token if it's expiring soon (but not during refresh requests)
  if (token && !path.includes('/auth/refresh') && isTokenExpiringSoon() && getRefreshToken()) {
    const newToken = await attemptRefresh();
    if (newToken) {
      token = newToken;
    } else {
      // Refresh failed, token was cleared - don't proceed
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  const res = await fetch(`/api${path}`, { 
    ...options, 
    headers,
    body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined)
  });
  
  // If unauthorized, try to refresh the token
  if (res.status === 401 && token) {
    const newToken = await attemptRefresh();
    
    if (newToken) {
      // Retry the request with the new token
      headers.Authorization = `Bearer ${newToken}`;
      const retryRes = await fetch(`/api${path}`, { ...options, headers });
      
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ error: retryRes.statusText }));
        throw new Error(err.error || retryRes.statusText);
      }
      return retryRes.json();
    }
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// TanStack Query compatible fetch function
export const queryFn = async ({ queryKey }) => {
  const [method, path, body] = queryKey;
  return request(path, {
    method: method || 'GET',
    body: body ? JSON.stringify(body) : undefined
  });
};

// Convenience functions for TanStack Query
export const endpoints = {
  // Auth
  getMe: () => ['GET', '/auth/me'],
  login: (email, password) => ['POST', '/auth/login', { email, password }],
  register: (username, email, password, displayName) => ['POST', '/auth/register', { username, email, password, displayName }],
  logout: () => ['POST', '/auth/logout', {}],
  
  // Topics
  getTopics: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return ['GET', `/topics${searchParams ? '?' + searchParams : ''}`];
  },
  getTopic: (id) => ['GET', `/topics/${id}`],
  getTrendingTopics: () => ['GET', '/topics/trending'],
  createTopic: (data) => ['POST', '/topics', data],
  joinTopic: (id) => ['POST', `/topics/${id}/join`, {}],
  getTopicParticipants: (id) => ['GET', `/topics/${id}/participants`],
  
  // Messages
  getGlobalMessages: () => ['GET', '/messages/global'],
  getGlobalStats: () => ['GET', '/messages/global/stats'],
  getTopicMessages: (topicId) => ['GET', `/messages/topic/${topicId}`],
  getThreadMessages: (messageId) => ['GET', `/messages/thread/${messageId}`],
  getMiniRoomMessages: (messageId) => ['GET', `/messages/mini-room/${messageId}`],
  getMiniRoomStats: (messageId) => ['GET', `/messages/mini-room/${messageId}/stats`],
  getUserThreads: (userId) => ['GET', `/messages/user-threads/${userId}`],
  getUserProfile: (id) => ['GET', `/users/${id}`],
  getFollowingStatus: (id) => ['GET', `/users/${id}/following-status`],
  followUser: (id) => ['POST', `/users/${id}/follow`, {}],
  sendMessage: (data) => ['POST', '/messages', data],
  editMessage: (id, content) => ['PATCH', `/messages/${id}`, { content }],
  deleteMessage: (id) => ['DELETE', `/messages/${id}`],
  reactMessage: (id, type) => ['POST', `/messages/${id}/react`, { type }],
  reportMessage: (id, reason) => ['POST', `/messages/${id}/report`, { reason }],
  
  // Notifications
  getNotifications: () => ['GET', '/notifications'],
  markNotificationsRead: () => ['PUT', '/notifications/read-all', {}],
  
  // Users
  searchUsers: (query) => [`GET`, `/users/search?q=${encodeURIComponent(query)}`],
  updateProfile: (data) => ['PUT', '/auth/me', data],
  updatePushNotifications: (enabled) => ['PUT', '/auth/me', { pushNotifications: enabled }],
};

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  
  // Expose token management for AuthContext
  setTokens,
  clearTokens,
  scheduleTokenRefresh,
  getRefreshToken,
  getTokenExpiresAt,
  isTokenExpired,
  isTokenExpiringSoon,
  
  // Expose for TanStack Query
  queryFn,
  endpoints,
};

export default api;

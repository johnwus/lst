import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { initSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('lt_token'));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const me = await api.get('/auth/me');
      setUser(me);
      return me;
    } catch {
      setUser(null);
      setToken(null);
      api.clearTokens();
      return null;
    }
  }, []);

  // Initialize token expiration tracking on mount
  useEffect(() => {
    // If we have a token but no expiration timestamp, set a default (24 hours from now)
    // This handles cases where the user refreshes the page after login
    const existingToken = localStorage.getItem('lt_token');
    const existingExpiresAt = localStorage.getItem('lt_token_expires_at');
    
    if (existingToken && !existingExpiresAt) {
      // Token exists but no expiration - assume 24 hours (backend default)
      const defaultExpiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('lt_token_expires_at', defaultExpiry.toString());
    }
    
    // Schedule token refresh if we have a valid token
    if (existingToken && !api.isTokenExpired()) {
      api.scheduleTokenRefresh('24h');
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe().finally(() => setLoading(false));
      initSocket(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    // Pass expiresIn to properly track token expiration
    api.setTokens(data.accessToken, data.refreshToken, data.expiresIn || '24h');
    setToken(data.accessToken);
    setUser(data.user);
    // Socket will be initialized by useEffect when token changes
    // Schedule token refresh
    api.scheduleTokenRefresh(data.expiresIn || '24h');
    return data.user;
  };

  const register = async (username, email, password, displayName) => {
    const data = await api.post('/auth/register', { username, email, password, displayName });
    // Pass expiresIn to properly track token expiration
    api.setTokens(data.accessToken, data.refreshToken, data.expiresIn || '24h');
    setToken(data.accessToken);
    setUser(data.user);
    // Socket will be initialized by useEffect when token changes
    // Schedule token refresh
    api.scheduleTokenRefresh(data.expiresIn || '24h');
    return data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout', {}); } catch {}
    api.clearTokens();
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

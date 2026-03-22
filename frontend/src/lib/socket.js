import { io } from 'socket.io-client';

let socket = null;
let currentToken = null;

export function getSocket() {
  return socket;
}

export function initSocket(token) {
  // Don't reconnect if already connected with the same token
  if (socket && socket.connected && currentToken === token) {
    console.log('Socket already connected with same token, skipping reconnect');
    return socket;
  }

  // If socket exists but not connected, try to reconnect first before creating new one
  if (socket && !socket.connected && currentToken === token) {
    console.log('Socket exists but disconnected, attempting to reconnect');
    socket.connect();
    return socket;
  }

  // Disconnect existing socket only if token changed
  if (socket && currentToken !== token) {
    socket.disconnect();
  }

  currentToken = token;

  socket = io({
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    // Mobile-specific optimizations
    forceNew: false,
    multiplex: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  // Handle reconnection gracefully
  socket.io.on('reconnect', (attempt) => {
    console.log('Socket reconnected after', attempt, 'attempts');
  });

  socket.io.on('reconnect_attempt', (attempt) => {
    console.log('Socket reconnection attempt:', attempt);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

// Update socket with new token (for token refresh)
export function updateSocketToken(token) {
  if (socket && socket.connected) {
    currentToken = token;
    // Trigger reconnection with new token
    socket.auth.token = token;
    socket.disconnect();
    socket.connect();
    console.log('Socket token updated');
  } else if (token) {
    // If not connected, initialize with new token
    initSocket(token);
  }
}

import { Server } from 'socket.io';

export let io = null;
export const onlineUsers = new Map();

/**
 * Initializes the Socket.io server instance
 * @param {HttpServer} httpServer - The Node.js HTTP server
 * @param {Array<string>} allowedOrigins - List of CORS allowed origins
 * @returns {Server} The initialized Socket.io instance
 */
export function initSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });
  
  return io;
}

/**
 * Returns the global Socket.io instance
 * @returns {Server}
 */
export function getIo() {
  return io;
}



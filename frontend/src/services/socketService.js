import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  if (!socket) {
    socket = io("http://localhost:5000");
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function emitNewMessage(message) {
  if (socket) {
    socket.emit("new-message", message);
  }
}

export function emitJoinTopic(topicId) {
  if (socket) {
    socket.emit("join-topic", { topicId });
  }
}

export function emitLeaveTopic(topicId) {
  if (socket) {
    socket.emit("leave-topic", { topicId });
  }
}

export function emitTyping(data) {
  if (socket) {
    socket.emit("typing", data);
  }
}
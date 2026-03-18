import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
    if (!socket) {
        socket = io("http://localhost:3000"); // backend server
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
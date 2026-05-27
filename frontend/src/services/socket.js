import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  const token = localStorage.getItem("buildora_token");
  if (!token) return null;

  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      autoConnect: true
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

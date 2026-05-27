import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const instance = getSocket();
    setSocket(instance);

    if (!instance) return undefined;

    const handlePresence = (users) => setOnlineUsers(users);
    instance.on("presence:update", handlePresence);

    return () => {
      instance.off("presence:update", handlePresence);
    };
  }, []);

  return { socket, onlineUsers };
};

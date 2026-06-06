import { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const NotifCtx = createContext(null);

const initialState = { notifications: [], unreadCount: 0, loading: true };

const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD":
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        loading: false
      };
    case "ADD":
      // Prevent duplicates if the same notification arrives twice
      if (state.notifications.some((n) => n._id === action.payload._id)) return state;
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case "MARK_READ": {
      const wasUnread = state.notifications.find((n) => n._id === action.payload && !n.isRead);
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n._id === action.payload ? { ...n, isRead: true } : n
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    }
    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0
      };
    case "DELETE": {
      const target = state.notifications.find((n) => n._id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter((n) => n._id !== action.payload),
        unreadCount: target && !target.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    }
    case "SET_UNREAD":
      return { ...state, unreadCount: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications?limit=20");
      dispatch({
        type: "LOAD",
        payload: { notifications: data.notifications, unreadCount: data.unreadCount }
      });
    } catch {
      dispatch({ type: "LOAD", payload: { notifications: [], unreadCount: 0 } });
    }
  }, []);

  // Load initial data when user changes
  useEffect(() => {
    if (!user) {
      dispatch({ type: "RESET" });
      return;
    }
    fetchNotifications();
  }, [user, fetchNotifications]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!user) return undefined;

    const attach = () => {
      const socket = getSocket();
      if (!socket) return undefined;

      const onNew = (notification) => dispatch({ type: "ADD", payload: notification });
      const onCount = ({ count }) => dispatch({ type: "SET_UNREAD", payload: count });

      socket.on("notification:new", onNew);
      socket.on("notification:unread_count", onCount);

      return () => {
        socket.off("notification:new", onNew);
        socket.off("notification:unread_count", onCount);
      };
    };

    // Socket might not be ready immediately on mount — retry briefly
    const cleanup = attach();
    return cleanup;
  }, [user]);

  const markRead = useCallback(async (id) => {
    dispatch({ type: "MARK_READ", payload: id }); // optimistic
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      // revert on failure — refetch ground truth
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    dispatch({ type: "MARK_ALL_READ" }); // optimistic
    try {
      await api.put("/notifications/mark-all-read");
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotif = useCallback(async (id) => {
    dispatch({ type: "DELETE", payload: id }); // optimistic
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return (
    <NotifCtx.Provider
      value={{ ...state, markRead, markAllRead, deleteNotif, refetch: fetchNotifications }}
    >
      {children}
    </NotifCtx.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotifCtx);
  return ctx || { notifications: [], unreadCount: 0, loading: false, markRead: () => {}, markAllRead: () => {}, deleteNotif: () => {}, refetch: () => {} };
};

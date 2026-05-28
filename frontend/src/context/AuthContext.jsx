import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../services/api";
import { disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

const getStoredUser = () => {
  const raw = localStorage.getItem("buildora_user");
  if (!raw || raw === "undefined" || raw === "null") return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("buildora_user");
    localStorage.removeItem("buildora_token");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);

  const persistSession = ({ token, user: nextUser }) => {
    localStorage.setItem("buildora_token", token);
    localStorage.setItem("buildora_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", payload);
      persistSession(data);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      const { data } = await api.post("/auth/register", formData);
      persistSession(data);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    const { data } = await api.get("/auth/me");
    localStorage.setItem("buildora_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("buildora_token");
    localStorage.removeItem("buildora_user");
    disconnectSocket();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, setUser, loading, login, register, logout, refreshMe, isAuthenticated: Boolean(user) }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

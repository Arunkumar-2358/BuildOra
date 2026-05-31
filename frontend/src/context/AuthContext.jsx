import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  // On mount, re-sync the cached user with the token's real identity/role.
  // This prevents a stale cached profile (e.g. a "customer" object left over
  // while the active token belongs to a contractor — which happens when a
  // second account is logged in from another tab on the same origin) from
  // driving the UI into role-gated actions the server will reject with 403.
  useEffect(() => {
    if (!localStorage.getItem("buildora_token")) return;
    refreshMe().catch((err) => {
      if (err.response?.status === 401) logout();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep every open tab in sync: if the token or user changes in another tab,
  // reflect it here so the role-gated UI never diverges from the live session.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "buildora_token" || event.key === "buildora_user") {
        if (!localStorage.getItem("buildora_token")) {
          disconnectSocket();
          setUser(null);
        } else {
          setUser(getStoredUser());
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, login, register, logout, refreshMe, isAuthenticated: Boolean(user) }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

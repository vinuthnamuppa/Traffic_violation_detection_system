import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "tv_auth";

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStoredAuth(data) {
  if (!data) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored?.accessToken && stored?.user) {
      setAccessToken(stored.accessToken);
      setUser(stored.user);
    }
  }, []);

  useEffect(() => {
    if (accessToken && user) {
      writeStoredAuth({ accessToken, user });
    } else {
      writeStoredAuth(null);
    }
  }, [accessToken, user]);

  const login = (payload) => {
    setAccessToken(payload.access_token);
    setUser(payload.user);
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      role: user?.role || "public",
      login,
      logout
    }),
    [accessToken, user]
  );

  // Attach token to axios instance globally whenever it changes
  useEffect(() => {
    api.setToken(accessToken || null);
  }, [accessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}


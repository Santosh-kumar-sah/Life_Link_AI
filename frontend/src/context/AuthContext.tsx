import React, { createContext, useContext, useState, useEffect } from "react";
import { User, ApiResponse } from "../types/api";
import fetchClient from "../utils/fetchClient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: "donor" | "recipient" | "admin") => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Loads active session on initial page load
  const refreshUser = async () => {
    try {
      setLoading(true);
      const data = await fetchClient<{ user: User }>("/api/v1/auth/me");
      setUser(data.user);
      setError(null);
    } catch (err: any) {
      setUser(null);
      // Don't treat a 401 on initial load as a noisy error, just means user is guest
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchClient<{ user: User }>("/api/v1/auth/login", {
        method: "POST",
        json: { email, password }
      });
      setUser(data.user);
      // Immediately load full profiles (if profiles are empty initially)
      await refreshUser();
    } catch (err: any) {
      const errMsg = err.error?.message || "Failed to log in. Please check your credentials.";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, role: "donor" | "recipient" | "admin") => {
    try {
      setLoading(true);
      setError(null);
      await fetchClient("/api/v1/auth/register", {
        method: "POST",
        json: { email, password, role }
      });
    } catch (err: any) {
      const errMsg = err.error?.message || "Registration failed. Please try again.";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await fetchClient("/api/v1/auth/logout", { method: "POST" });
    } catch (err) {
      // Clean up local state regardless of server logout success
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Listen to token expiration event
    const handleSessionExpired = () => {
      setUser(null);
      setError("Your session has expired. Please log in again.");
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

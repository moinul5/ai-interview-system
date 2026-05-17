/**
 * AuthContext.jsx
 * ---------------
 * Global authentication state using React Context.
 * Simple password-based auth — no JWT tokens.
 * Provides: { user, isAuthenticated, login, logout, loading }
 *
 * - login()  → calls POST /auth/login, stores user in localStorage
 * - logout() → clears localStorage, resets state
 * - On mount, restores session from localStorage so page refreshes keep you logged in
 */

import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, logoutUser } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Restore session from localStorage on app load ────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const userData = await loginUser(email, password);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Custom hook for consuming auth context */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export default AuthContext;

/**
 * AuthContext.jsx
 * ---------------
 * Global authentication state using React Context.
 * Provides: { user, token, isAuthenticated, login, logout, loading }
 *
 * BACKEND INTEGRATION:
 *   - login() calls authService.loginUser() which hits your backend
 *   - Stores JWT token in localStorage after successful login
 *   - On app load, restores user from localStorage if token exists
 */

import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, logoutUser, getCurrentUser } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(localStorage.getItem("access_token") || null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // ─── Restore session on app load ──────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        try {
          // TODO (Backend): GET /auth/me — fetch current user with stored token
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setToken(storedToken);
        } catch {
          // Token is invalid or expired — clear storage
          localStorage.removeItem("access_token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  /**
   * @param {string} email
   * @param {string} password
   * TODO (Backend): POST /auth/login → { access_token, user }
   */
  const login = async (email, password) => {
    const data = await loginUser(email, password);
    // TODO (Backend): Adjust field names if your response differs
    const { access_token, user: userData } = data;
    localStorage.setItem("access_token", access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await logoutUser();
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
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

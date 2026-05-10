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
  // Bypassing auth: always provide a dummy user
  const [user, setUser]       = useState({ full_name: "Test User", email: "test@example.com", id: 1 });
  const [token, setToken]     = useState("dummy_token_for_now");
  const [loading, setLoading] = useState(false); // No loading needed

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

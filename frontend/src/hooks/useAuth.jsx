// frontend/src/hooks/useAuth.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import Cookies from 'js-cookie'; // No longer strictly needed for auth status, Flask-Login handles it

const AuthContext = createContext(null);
const API_BASE_URL = 'http://127.0.0.1:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    setLoadingAuth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/@me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.is_authenticated) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else if (response.status === 401) {
        // Not authenticated, which is expected if no session
        setUser(null);
        setIsAuthenticated(false);
      } else {
        console.error("Error checking auth status:", response.status, await response.text());
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Network error checking auth status:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = useCallback(async (email, password) => {
    setLoadingAuth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for setting session cookie
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setIsAuthenticated(true);
        // App.jsx useEffect will handle navigation
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: error.message || 'Network error during login' };
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    setLoadingAuth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include', // Important for setting session cookie
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error("Registration failed:", error);
      return { success: false, error: error.message || 'Network error during registration' };
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoadingAuth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'GET', // Or POST if your backend expects it
        credentials: 'include',
      });

      if (response.ok) {
        setUser(null);
        setIsAuthenticated(false);
      } else {
        console.error("Logout failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const authContextValue = React.useMemo(() => ({
    user,
    isAuthenticated,
    loadingAuth,
    login,
    register,
    logout,
    checkAuthStatus
  }), [user, isAuthenticated, loadingAuth, login, register, logout, checkAuthStatus]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
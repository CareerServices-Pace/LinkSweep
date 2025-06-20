import React, { createContext, useContext, useState, useEffect } from "react";
import AuthService from "../services/auth";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const result = await AuthService.checkAuth();
      if (result.success && result.authenticated) {
        setUser(result.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const result = await AuthService.login(credentials);
      if (result.success) {
        // Get user info after successful login
        const userResult = await AuthService.getCurrentUser();
        if (userResult.success) {
          setUser(userResult.user);
          setIsAuthenticated(true);
        }
      }
      return result;
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const signup = async (userData) => {
    try {
      const result = await AuthService.signup(userData);
      if (result.success) {
        // Get user info after successful signup
        const userResult = await AuthService.getCurrentUser();
        if (userResult.success) {
          setUser(userResult.user);
          setIsAuthenticated(true);
        }
      }
      return result;
    } catch (error) {
      console.error("Signup failed:", error);
      return { success: false, error: "Signup failed. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
      // Clear state even if logout fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

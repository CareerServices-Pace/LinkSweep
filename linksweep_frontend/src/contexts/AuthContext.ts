
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthService } from "@/services/Auth";
import { useLocation } from "react-router-dom";

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: { email: string; username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on app load
  const location = useLocation();
  const publicRoutes = ["/login", "/signup", "/forgot-password"];

  useEffect(() => {
    if (!publicRoutes.includes(location.pathname)) {
      checkAuthStatus();
    } else {
      setLoading(false); // Avoid spinner forever
    }
  }, [location.pathname]);

  
  const checkAuthStatus = async (): Promise<void> => {

    if (!loading && !isAuthenticated) return;

    setLoading(true);
    try {
      const result = await AuthService.checkAuth();
      if (result.success && result.authenticated && result.user) {
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

  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const result = await AuthService.login(credentials);

      if (result.success) {
        // After successful login, get user info
        const userResult = await AuthService.getCurrentUser();
        if (userResult.success && userResult.user) {
          setUser(userResult.user);
          setIsAuthenticated(true);
        }
      }

      return result;
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: "Login failed. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: { email: string; username: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const result = await AuthService.signup(userData);

      if (result.success) {
        // After successful signup, get user info
        const userResult = await AuthService.getCurrentUser();
        if (userResult.success && userResult.user) {
          setUser(userResult.user);
          setIsAuthenticated(true);
        }
      }

      return result;
    } catch (error) {
      console.error("Signup failed:", error);
      return { success: false, error: "Signup failed. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
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

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    checkAuthStatus,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export default AuthContext;

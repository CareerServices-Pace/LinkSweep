import axios, { AxiosInstance, AxiosResponse } from "axios";
import { number } from "zod";

// Create axios instance with default config
const API_BASE_URL = import.meta.env.REACT_APP_API_URL;

const authAPI: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always send cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Types for API responses
interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  name?: string;
}

interface AuthResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]> | null;
}

interface SignupData {
  email: string;
  username: string;
  password: string;
}

interface CreateUserData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role_id: number;
}

interface Role {
  id: string;
  name: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface CheckAuthResponse {
  success: boolean;
  authenticated: boolean;
  user?: User;
  error?: string;
}

interface UserResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Request interceptor - doesn't add Authorization header (httpOnly cookies handle auth)
authAPI.interceptors.request.use(
  (config) => {
    // Don't add any authorization headers - let httpOnly cookies handle it
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling 401s and automatic token refresh
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const currentPath = window.location.pathname;
    const publicRoutes = ["/login", "/signup", "/forgot-password"];

    // Prevent infinite loop
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh") &&
      !publicRoutes.includes(currentPath)
    ) {
      originalRequest._retry = true;

      try {
        await authAPI.post("/auth/refresh"); // This should set new access_token cookie
        return authAPI(originalRequest); // Retry original request
      } catch (refreshError) {
        console.error("Refresh failed:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/auth/signup", {
        email: userData.email,
        username: userData.username,
        password: userData.password,
      });

      // Successful signup - tokens are now in httpOnly cookies
      return {
        success: true,
        data: response.data,
        message: "Account created successfully!",
      };
    } catch (error: any) {
      console.error(
        "Signup error:",
        error.response?.data?.detail || error.message,
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Failed to create account. Please try again.",
        fieldErrors: error.response?.data?.errors || null,
      };
    }
  }

  /**
   * Log in user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });

      // Successful login - tokens are now in httpOnly cookies
      return {
        success: true,
        data: response.data,
        message: "Logged in successfully!",
      };
    } catch (error: any) {
      console.error(
        "Login error:",
        error.response?.data?.detail || error.message,
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Invalid email or password. Please try again.",
      };
    }
  }

  /**
   * Log out user
   */
  static async logout(): Promise<AuthResponse> {
    try {
      await authAPI.post("/auth/logout");

      // Redirect to login page after successful logout
      window.location.href = "/login";

      return {
        success: true,
        message: "Logged out successfully!",
      };
    } catch (error: any) {
      console.error(
        "Logout error:",
        error.response?.data?.detail || error.message,
      );

      // Even if logout fails on server, clear client-side state
      window.location.href = "/login";

      return {
        success: false,
        error: "Logout failed, but you have been redirected to login.",
      };
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/auth/refresh");

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error(
        "Token refresh error:",
        error.response?.data?.detail || error.message,
      );

      return {
        success: false,
        error: "Session expired. Please log in again.",
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  static async checkAuth(): Promise<CheckAuthResponse> {
    try {
      const res = await authAPI.get("/auth/me");
      return {
        success: true,
        authenticated: true,
        user: res.data,
      };
    } catch (error) {
      return {
        success: false,
        authenticated: false,
        error: error.response?.data?.detail || "Unknown error",
      };
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await authAPI.get("/auth/me");

      return {
        success: true,
        user: response.data,
      };
    } catch (error: any) {
      console.error(
        "Get user error:",
        error.response?.data?.detail || error.message,
      );

      return {
        success: false,
        error: "Failed to get user information.",
      };
    }
  }
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await authAPI.get("/auth/users");
      return response.data;
    } catch (error: any) {
      console.error(
        "Get users error:",
        error.response?.data?.detail || error.message,
      );
      throw new Error("Failed to load users. Please try again.");
    }
  }

  /**
   * Promote/Demote user admin status
   */
  static async toggleUserAdmin(userId: string): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/auth/promote", { user_id: Number(userId) });
      return {
        success: true,
        data: response.data,
        message: "User admin status updated successfully.",
      };
    } catch (error: any) {
      console.error(
        "Toggle admin error:",
        error.response?.data?.detail || error.message,
      );
      return {
        success: false,
        error: "Failed to update user admin status. Please try again.",
      };
    }
  }

  /**
   * Get all roles
   */
  static async getRoles(): Promise<Role[]> {
    try {
      const response = await authAPI.get("/auth/roles");
      return response.data;
    } catch (error: any) {
      console.error(
        "Get roles error:",
        error.response?.data?.detail || error.message,
      );
      throw new Error("Failed to load roles. Please try again.");
    }
  }

  /**
   * Create new user (Admin only)
   */
  static async createUser(userData: CreateUserData): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/auth/signup", {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        username: userData.username,
        role_id: userData.role_id,
      });

      return {
        success: true,
        data: response.data,
        message: "User created successfully!",
      };
    } catch (error: any) {
      console.error(
        "Create user error:",
        error.response?.data?.detail || error.message,
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Failed to create user. Please try again.",
        fieldErrors: error.response?.data?.errors || null,
      };
    }
  }

  static async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/auth/request-reset", { email });

      const token = response.data.token;

      return {
        success: true,
        data: { token },
        message: "OTP sent successfully!",
      };
    } catch (error: any) {
      console.error(
        "Password reset request error:",
        error.response?.data?.detail || error.message,
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Failed to send OTP. Please try again.",
      };
    }
  }

  static async verifyOtp(email: string, otp: string, token: string): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/auth/verify-otp", { email, otp, token });

      return {
        success: true,
        data: response.data, // optional: email or decoded info
        message: "OTP verified successfully!",
      };
    } catch (error: any) {
      console.error("OTP verification failed:", error.response?.data?.detail || error.message);

      return {
        success: false,
        error:
          error.response?.data?.detail || "Invalid or expired OTP. Please try again.",
      };
    }
  };

  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });

      return {
        success: true,
        message: response.data?.message || "Password reset successful!",
      };
    } catch (error: any) {
      console.error("Password reset error:", error.response?.data?.detail || error.message);

      return {
        success: false,
        error:
          error.response?.data?.detail || "Failed to reset password. Please try again.",
      };
    }
  };

  static async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse> {
    try {
      const response = await authAPI.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      return {
        success: true,
        message: response.data?.message || "Password changed successfully!",
      };
    } catch (error: any) {
      console.error("Change password error:", error.response?.data?.detail || error.message);

      return {
        success: false,
        error:
          error.response?.data?.detail || "Failed to change password. Please try again.",
      };
    }
  }

}

export const apiClient = authAPI;

export default AuthService;

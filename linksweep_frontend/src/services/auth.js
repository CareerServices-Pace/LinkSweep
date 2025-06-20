import axios from "axios";

// Create axios instance with default config
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always send cookies
  headers: {
    "Content-Type": "application/json",
  },
});

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
  (response) => {
    return response;
  },
  async (error) => {
    const original = error.config;

    // If we get 401 and haven't already tried to refresh
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // Try to refresh token
        await authAPI.post("/auth/refresh");
        // Retry the original request
        return authAPI(original);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export class AuthService {
  /**
   * Sign up a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.username - Username
   * @param {string} userData.password - Password
   * @returns {Promise} API response
   */
  static async signup(userData) {
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
    } catch (error) {
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
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - Password
   * @returns {Promise} API response
   */
  static async login(credentials) {
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
    } catch (error) {
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
   * @returns {Promise} API response
   */
  static async logout() {
    try {
      await authAPI.post("/auth/logout");

      // Redirect to login page after successful logout
      window.location.href = "/login";

      return {
        success: true,
        message: "Logged out successfully!",
      };
    } catch (error) {
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
   * @returns {Promise} API response
   */
  static async refreshToken() {
    try {
      const response = await authAPI.post("/auth/refresh");

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
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
   * @returns {Promise} Authentication status
   */
  static async checkAuth() {
    try {
      const response = await authAPI.get("/auth/me");

      return {
        success: true,
        authenticated: true,
        user: response.data,
      };
    } catch (error) {
      return {
        success: false,
        authenticated: false,
        error: "Not authenticated",
      };
    }
  }

  /**
   * Get current user info
   * @returns {Promise} User data
   */
  static async getCurrentUser() {
    try {
      const response = await authAPI.get("/auth/me");

      return {
        success: true,
        user: response.data,
      };
    } catch (error) {
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
}

// Export the configured axios instance for other API calls
export const apiClient = authAPI;

export default AuthService;

// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // In your AuthContext.jsx
  const refreshSession = async () => {
    console.log("Refreshing session...");
    const refreshToken = localStorage.getItem("chat_pdf_refresh_token");
    console.log("Refresh token:", refreshToken);

    if (!refreshToken) {
      logout();
      return false;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/refresh-token`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Refresh response:", response.data);

      if (response.status !== 200) {
        logout();
        return false;
      }

      const data = response.data;

      // Update stored tokens with new ones
      localStorage.setItem("chat_pdf_access_token", data.access_token);
      localStorage.setItem("chat_pdf_refresh_token", data.refresh_token);
      localStorage.setItem("chat_pdf_user_id", data.user_id); // ✅ Add this too
      localStorage.setItem("chat_pdf_user_email", data.email); // ✅ Add this too
      localStorage.setItem(
        "chat_pdf_token_expires_at",
        Date.now() + 3600 * 1000
      );

      setUser({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user_id: data.user_id,
        email: data.email,
      });

      setIsAuthenticated(true);
      console.log("✅ User authenticated after refresh");

      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return false;
    }
  };

  // Update checkAuthStatus to use refresh instead of immediate logout
  const checkAuthStatus = async () => {
    console.log("Checking auth status...");
    try {
      const accessToken = localStorage.getItem("chat_pdf_access_token");
      const refreshToken = localStorage.getItem("chat_pdf_refresh_token");
      const expiresAt = localStorage.getItem("chat_pdf_token_expires_at");

      console.log("Access token:", accessToken);
      console.log("Refresh token:", refreshToken);
      console.log("Token expires at:", expiresAt);
      if (!accessToken || !refreshToken) {
        clearAuthData();
        return;
      }

      const now = Date.now();
      const tokenExpiresAt = parseInt(expiresAt);
      console.log("Current time:", now, "Token expires at:", tokenExpiresAt);

      if (now < tokenExpiresAt) {
        console.log("Token is still valid");
        // Token still valid
        setUser({
          access_token: accessToken,
          refresh_token: refreshToken,
          user_id: localStorage.getItem("chat_pdf_user_id"),
          email: localStorage.getItem("chat_pdf_user_email"),
        });
        setIsAuthenticated(true);
      } else {
        // Token expired - try to refresh
        console.log("Token expired, trying to refresh...");
        const refreshed = await refreshSession();
        console.log("Refreshed session:", refreshed);
        if (!refreshed) {
          clearAuthData();
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const login = (authResponse) => {
    try {
      // Handle both immediate login and email confirmation cases
      if (authResponse.access_token && authResponse.refresh_token) {
        // Store tokens with prefixed keys
        localStorage.setItem(
          "chat_pdf_access_token",
          authResponse.access_token
        );
        localStorage.setItem(
          "chat_pdf_refresh_token",
          authResponse.refresh_token
        );
        localStorage.setItem("chat_pdf_user_id", authResponse.user_id);
        localStorage.setItem("chat_pdf_user_email", authResponse.email);

        // Calculate expiry (usually 1 hour = 3600 seconds)
        const expiresAt = Date.now() + 3600 * 1000;
        localStorage.setItem("chat_pdf_token_expires_at", expiresAt.toString());

        // Update state
        setUser({
          access_token: authResponse.access_token,
          refresh_token: authResponse.refresh_token,
          user_id: authResponse.user_id,
          email: authResponse.email,
        });
        setIsAuthenticated(true);

        return { success: true };
      } else {
        // Email confirmation required case
        return {
          success: true,
          requiresConfirmation: true,
          message: authResponse.message,
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    }
  };

  const logout = () => {
    clearAuthData();
    // Optionally, we could call your backend logout endpoint here
    // await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${user?.access_token}` }});
  };

  const clearAuthData = () => {
    // Clear all auth-related data
    localStorage.removeItem("chat_pdf_access_token");
    localStorage.removeItem("chat_pdf_refresh_token");
    localStorage.removeItem("chat_pdf_user_id");
    localStorage.removeItem("chat_pdf_user_email");
    localStorage.removeItem("chat_pdf_token_expires_at");
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  // Get auth header for API calls
  const getAuthHeader = () => {
    if (user?.access_token) {
      return { Authorization: `Bearer ${user.access_token}` };
    }
    return {};
  };

  // Check if token is about to expire and refresh if needed
  const checkTokenExpiry = async () => {
    const expiresAt = localStorage.getItem("chat_pdf_token_expires_at");
    if (!expiresAt) return false;

    const now = Date.now();
    const tokenExpiresAt = parseInt(expiresAt);

    // If token expires in less than 5 minutes, consider refreshing
    if (now > tokenExpiresAt - 5 * 60 * 1000) {
      // Token is expiring soon - you could implement refresh logic here
      // For now, just logout
      logout();
      return false;
    }

    return true;
  };

  const isUserLoggedIn = () => {
    try {
      const accessToken = localStorage.getItem("chat_pdf_access_token");
      const expiresAt = localStorage.getItem("chat_pdf_token_expires_at");
      const userId = localStorage.getItem("chat_pdf_user_id");

      // Check if token exists
      if (!accessToken || !expiresAt || !userId) {
        return false;
      }

      // Check if token is expired
      const currentTime = Date.now();
      const tokenExpiryTime = parseInt(expiresAt, 10);

      if (currentTime >= tokenExpiryTime) {
        // Token expired, clean up storage
        // clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    getAuthHeader,
    checkTokenExpiry,
    clearAuthData,
    isUserLoggedIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

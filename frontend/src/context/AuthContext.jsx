// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const accessToken = localStorage.getItem("chat_pdf_access_token");
      const refreshToken = localStorage.getItem("chat_pdf_refresh_token");
      const expiresAt = localStorage.getItem("chat_pdf_token_expires_at");

      if (accessToken && refreshToken && expiresAt) {
        // Check if token is still valid
        const now = Date.now();
        const tokenExpiresAt = parseInt(expiresAt);

        if (now < tokenExpiresAt) {
          // Token is valid - fetch user profile or set basic user info
          const userData = {
            access_token: accessToken,
            refresh_token: refreshToken,
            // You might want to store user_id and email from the signup/login response
            user_id: localStorage.getItem("chat_pdf_user_id"),
            email: localStorage.getItem("chat_pdf_user_email"),
          };

          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token expired - clear everything
          clearAuthData();
        }
      } else {
        // No tokens found
        clearAuthData();
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
    // Optionally, you could call your backend logout endpoint here
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

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    getAuthHeader,
    checkTokenExpiry,
    clearAuthData,
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

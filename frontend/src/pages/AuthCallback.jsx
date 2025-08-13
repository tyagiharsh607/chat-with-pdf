// src/pages/AuthCallback.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../services/apiClient";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let processed = false;
    let timeoutId;

    const handleAuthCallback = async () => {
      if (processed) return;

      try {
        const hash = window.location.hash.substring(1);
        if (!hash) {
          setError("No authentication data received");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          processed = true;

          try {
            // Fetch user profile with the fresh access token (manually attach header)
            const response = await apiClient.get("/auth/profile", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            const userProfile = response.data;

            const authResponse = {
              access_token: accessToken,
              refresh_token: refreshToken,
              user_id: userProfile.user_id,
              email: userProfile.email,
              message: "Email confirmation successful",
              requires_confirmation: false,
            };

            const loginResult = login(authResponse);

            if (loginResult.success) {
              // Clean the URL hash part to avoid token exposure
              window.history.replaceState(null, null, window.location.pathname);

              // Redirect to home page
              navigate("/", { replace: true });
            } else {
              setError("Failed to complete authentication");
              setTimeout(() => navigate("/login"), 2000);
            }
          } catch (profileError) {
            console.error("Profile fetch error:", profileError);
            setError("Failed to fetch user information");
            setTimeout(() => navigate("/login"), 2000);
          }
        } else {
          setError("Invalid authentication response");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Authentication failed");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    // Slight delay to ensure location.hash is populated
    timeoutId = setTimeout(handleAuthCallback, 100);

    return () => {
      processed = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, login]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
      }}
    >
      {error ? (
        <>
          <h2>Authentication Error</h2>
          <p style={{ color: "red" }}>{error}</p>
          <p>Redirecting to login...</p>
        </>
      ) : (
        <>
          <h2>Confirming your account...</h2>
          <p>Please wait while we complete your login.</p>
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 2s linear infinite",
              margin: "20px auto",
            }}
          />
        </>
      )}
    </div>
  );
};

export default AuthCallback;

// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      // Call backend login API
      const response = await loginUser(formData);

      // Use AuthContext login function
      const loginResult = login(response);

      if (loginResult.success) {
        // Successful login - redirect to home
        navigate("/");
      } else {
        setError(loginResult.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-theme px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-text-muted">Sign in to your ChatPDF account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface p-8 rounded-3xl shadow-2xl border border-border-primary backdrop-blur-sm"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-600 text-center font-medium">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="w-full p-4 pl-12 border border-border-primary rounded-2xl focus:outline-none focus:ring-3 focus:ring-brand-primary/30 focus:border-brand-primary bg-surface text-text-primary placeholder-text-muted transition-all duration-300"
                onChange={handleChange}
                value={formData.email}
                required
                disabled={loading}
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full p-4 pl-12 border border-border-primary rounded-2xl focus:outline-none focus:ring-3 focus:ring-brand-primary/30 focus:border-brand-primary bg-surface text-text-primary placeholder-text-muted transition-all duration-300"
                onChange={handleChange}
                value={formData.password}
                required
                disabled={loading}
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="mt-4 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium transition-colors duration-200"
            >
              Forgot password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-brand-primary text-white py-4 rounded-2xl font-semibold shadow-xl shadow-shadow-action transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-text-muted text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-brand-primary font-semibold hover:text-brand-primary/80 transition-colors duration-200"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

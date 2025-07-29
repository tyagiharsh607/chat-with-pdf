// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser } from "../services/auth";
import { useAuth } from "../context/AuthContext";
import zxcvbn from "zxcvbn";

const Signup = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordSuggestions, setPasswordSuggestions] = useState([]);

  // New state to control view
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState(""); // Store email for confirmation view

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      const result = zxcvbn(value);
      const scoreMap = ["Weak", "Weak", "Fair", "Good", "Strong"];
      setPasswordStrength(scoreMap[result.score]);
      setPasswordSuggestions(result.feedback.suggestions || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Password strength validation
    const result = zxcvbn(formData.password);
    if (result.score < 2) {
      setError("Password is too weak. Please choose a stronger password.");
      setLoading(false);
      return;
    }

    try {
      const response = await signupUser(formData);
      console.log("Signup response:", response);

      const loginResult = login(response);

      if (loginResult.success) {
        if (loginResult.requiresConfirmation) {
          // Email confirmation required - switch to email confirmation view
          setUserEmail(formData.email);
          setShowEmailConfirmation(true);
          // Clear form data for security
          setFormData({ name: "", email: "", password: "" });
        } else {
          // Successfully logged in with tokens (immediate login)
          navigate("/dashboard");
        }
      } else {
        setError(loginResult.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // Email Confirmation View
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-theme px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-surface p-8 rounded-3xl shadow-2xl border border-border-primary backdrop-blur-sm text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* Header */}
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Check Your Email
            </h1>
            <p className="text-text-muted mb-6">
              We've sent a confirmation link to
            </p>

            {/* Email Display */}
            <div className="bg-surface-hover border border-border-primary rounded-2xl p-4 mb-6">
              <p className="text-brand-primary font-semibold text-lg">
                {userEmail}
              </p>
            </div>

            {/* Instructions */}
            <div className="text-left mb-8 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <p className="text-sm text-text-secondary">
                  Click the confirmation link in your email
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <p className="text-sm text-text-secondary">
                  You'll be automatically signed in to your account
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <p className="text-sm text-text-secondary">
                  Start analyzing your PDF documents with ChatPDF
                </p>
              </div>
            </div>

            {/* Helpful Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-yellow-800 font-medium">
                  Didn't receive the email?
                </p>
              </div>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you entered the correct email address</li>
                <li>• Wait a few minutes for the email to arrive</li>
              </ul>
            </div>

            {/* Login Link */}
            <div className="mt-6 pt-6 border-t border-border-primary">
              <p className="text-text-muted text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-brand-primary font-semibold hover:text-brand-primary/80 transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Signup Form View (original form)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-theme px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Create Account
          </h1>
          <p className="text-text-muted">
            Join ChatPDF to start analyzing documents
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface p-8 rounded-3xl shadow-2xl border border-border-primary backdrop-blur-sm"
        >
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-600 text-center font-medium">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Name Field */}
            <div className="relative">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                className="w-full p-4 pl-12 border border-border-primary rounded-2xl focus:outline-none focus:ring-3 focus:ring-brand-primary/30 focus:border-brand-primary bg-surface text-text-primary placeholder-text-muted transition-all duration-300"
                onChange={handleChange}
                value={formData.name}
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

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

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-text-muted">
                    Password strength:
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength === "Weak"
                        ? "text-red-500"
                        : passwordStrength === "Fair"
                        ? "text-yellow-500"
                        : passwordStrength === "Good"
                        ? "text-blue-500"
                        : passwordStrength === "Strong"
                        ? "text-green-500"
                        : "text-gray-500"
                    }`}
                  >
                    {passwordStrength}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Password Suggestions */}
          {passwordSuggestions.length > 0 && (
            <div className="mt-6 p-4 bg-surface-hover rounded-2xl border border-border-primary">
              <p className="text-xs text-text-muted font-medium mb-2">
                Password suggestions:
              </p>
              <ul className="text-xs text-text-muted space-y-2">
                {passwordSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-brand-accent rounded-full mr-3"></div>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer mt-8 bg-brand-primary text-white py-4 rounded-2xl font-semibold shadow-xl shadow-shadow-action transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-text-muted text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-brand-primary font-semibold hover:text-brand-primary/80 transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

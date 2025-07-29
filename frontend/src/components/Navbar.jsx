import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Call AuthContext logout function
    navigate("/login"); // Redirect to login page
  };

  return (
    <nav className="bg-surface p-4 shadow-lg shadow-shadow-modal border-b border-border-primary">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Brand - Links to home */}
        <Link
          to="/"
          className="text-xl font-bold text-text-primary hover:text-text-primary/80 transition-colors duration-200"
        >
          ChatPDF
        </Link>

        <div className="flex items-center space-x-4">
          {/* Conditional rendering based on authentication status */}
          {isAuthenticated ? (
            // Authenticated user menu
            <>
              {/* User email/info display */}
              <span className="text-text-muted text-sm">
                {user?.email || "User"}
              </span>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                Logout
              </button>
            </>
          ) : (
            // Non-authenticated user menu
            <>
              <Link
                to="/login"
                className="text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Signup
              </Link>
            </>
          )}

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

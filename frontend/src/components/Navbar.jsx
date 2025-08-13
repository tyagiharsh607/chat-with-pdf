import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 left-0 z-50 bg-surface p-4 shadow-lg shadow-shadow-modal border-b border-border-primary">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold text-text-primary hover:text-text-primary/80 transition-colors duration-200"
        >
          ChatPDF
        </Link>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-text-muted text-sm">
                {user?.email || "User"}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-text-primary ${
                  location.pathname === "/login"
                    ? "bg-brand-primary "
                    : " hover:bg-brand-primary/90"
                }`}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-text-primary ${
                  location.pathname === "/signup"
                    ? "bg-brand-primary"
                    : " hover:bg-brand-primary/90"
                }`}
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

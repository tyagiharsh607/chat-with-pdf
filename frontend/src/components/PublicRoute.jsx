import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { isUserLoggedIn, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          <span className="text-text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  if (isUserLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;

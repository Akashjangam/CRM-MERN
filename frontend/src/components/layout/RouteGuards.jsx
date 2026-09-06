import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


/* =========================================================
   PROTECTED ROUTE
   ========================================================= */

export function ProtectedRoute({ children }) {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const location = useLocation();


  /*
   * Wait until AuthContext finishes checking
   * the stored authentication state.
   */

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }


  /*
   * User is not authenticated.
   * Send them to login.
   */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }


  return children;
}


/* =========================================================
   PUBLIC-ONLY ROUTE
   ========================================================= */

export function PublicOnlyRoute({ children }) {
  const {
    isAuthenticated,
    loading,
  } = useAuth();


  /*
   * Wait for authentication restoration.
   */

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }


  /*
   * Already logged in.
   * Don't allow access to Login/Register.
   */

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  return children;
}
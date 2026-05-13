import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

/**
 * Protège une route côté client.
 * - Non connecté → redirige vers /login (avec la page d'origine mémorisée)
 * - Connecté sans le rôle requis → redirige vers /
 *
 * requireAdmin : exige le rôle admin ou super_admin
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && profile?.role !== "admin" && profile?.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

/**
 * Protège une route côté client.
 * - Non connecté → redirige vers /login (avec la page d'origine mémorisée)
 * - Connecté sans le profil d'accès requis → redirige vers /
 *
 * requireAdmin : exige un profil d'accès administrateur complet
 * requirePermission : exige une permission calculée en code
 */
export default function ProtectedRoute({ children, requireAdmin = false, requirePermission = null }) {
  const { user, loading, hasPermission, isAdmin } = useAuth();
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

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requirePermission && !hasPermission(requirePermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

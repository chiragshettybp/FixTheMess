import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    // If a role is required, wait until profile is loaded to decide
    if (requiredRole && !profile) {
      return;
    }

    // If no specific role is required and user is on home page, redirect based on role
    if (!requiredRole && profile && window.location.pathname === '/') {
      switch (profile.role) {
        case 'superadmin':
          navigate('/superadmin');
          return;
        case 'admin':
          navigate('/admin');
          return;
        case 'government':
          navigate('/gov-panel');
          return;
        default:
          // Regular users stay on home page
          break;
      }
    }

    if (requiredRole && profile?.role !== requiredRole) {
      // Redirect to appropriate page based on role
      switch (profile?.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'superadmin':
          navigate('/superadmin');
          break;
        case 'government':
          navigate('/gov-panel');
          break;
        default:
          navigate('/');
          break;
      }
    }
  }, [user, profile, loading, requiredRole, navigate]);

  if (loading || (requiredRole && user && !profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};
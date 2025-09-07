import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface GovProtectedRouteProps {
  children: React.ReactNode;
}

export const GovProtectedRoute = ({ children }: GovProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/gov-auth');
        return;
      }

      if (profile?.role !== 'government') {
        // Redirect non-government users to regular auth with error message
        navigate('/auth', { 
          state: { 
            error: 'This login is for government panel only. Please use citizen login.' 
          }
        });
        return;
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'government') {
    return null;
  }

  return <>{children}</>;
};
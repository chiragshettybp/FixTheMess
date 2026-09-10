import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';

const SuperadminLogin = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.role === 'superadmin') {
      navigate('/superadmin');
    } else {
      navigate('/auth');
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Superadmin Access</CardTitle>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-muted-foreground">Verifying credentials...</p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Superadmin access is managed through your authenticated session. 
            Please sign in with a superadmin account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperadminLogin;
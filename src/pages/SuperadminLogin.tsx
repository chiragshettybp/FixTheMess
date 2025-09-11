import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock } from 'lucide-react';

const SuperadminLogin = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (pin === '23112004') {
      toast({
        title: "Access Granted",
        description: "Welcome to Superadmin Dashboard",
      });
      navigate('/superadmin');
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid security pin",
        variant: "destructive",
      });
    }
    
    setLoading(false);
    setPin('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Superadmin Access</CardTitle>
          <p className="text-muted-foreground">Enter security pin to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="password"
                  placeholder="Enter security pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-10 text-center text-lg tracking-wider"
                  maxLength={8}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || pin.length === 0}
            >
              {loading ? 'Verifying...' : 'Access Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperadminLogin;
import { useState } from 'react';
import { GovLoginForm } from '@/components/auth/GovLoginForm';
import { GovRegisterForm } from '@/components/auth/GovRegisterForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, CheckCircle } from 'lucide-react';

const GovAuth = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
          {/* Left side - Welcome message */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-4">
                <Shield className="h-12 w-12 text-primary mr-3" />
                <h1 className="text-4xl font-bold text-foreground">
                  Government Portal
                </h1>
              </div>
              <p className="text-xl text-muted-foreground mb-8">
                Streamline civic issue resolution and improve community engagement
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Efficient Management
                  </h3>
                  <p className="text-muted-foreground">
                    Access and manage citizen reports from your assigned region with powerful filtering and sorting tools.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Quick Resolution
                  </h3>
                  <p className="text-muted-foreground">
                    Update issue status, add comments, and upload resolution photos to keep citizens informed.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Secure Access
                  </h3>
                  <p className="text-muted-foreground">
                    Role-based access control ensures only authorized government officials can access sensitive data.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This portal is exclusively for government officers and officials. 
                Citizens should use the regular platform to report issues.
              </p>
            </div>
          </div>

          {/* Right side - Auth forms */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md shadow-lg">
              <CardContent className="p-8">
                {/* Toggle Buttons */}
                <div className="flex rounded-lg bg-muted p-1 mb-8">
                  <Button
                    variant={mode === 'login' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setMode('login')}
                  >
                    Login
                  </Button>
                  <Button
                    variant={mode === 'register' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setMode('register')}
                  >
                    Register
                  </Button>
                </div>

                {/* Forms */}
                {mode === 'login' ? (
                  <GovLoginForm onSwitchToRegister={() => setMode('register')} />
                ) : (
                  <GovRegisterForm onSwitchToLogin={() => setMode('login')} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovAuth;
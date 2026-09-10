import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
const Auth = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={logo} alt="FixTheMess Logo" className="h-16 mx-auto mb-2" />
            <p className="text-muted-foreground">
              Report civic issues and help improve your community
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex rounded-lg p-1 mb-6 bg-neutral-900">
            <Button variant={mode === 'login' ? 'default' : 'ghost'} className="flex-1" onClick={() => setMode('login')}>
              Login
            </Button>
            <Button variant={mode === 'register' ? 'default' : 'ghost'} className="flex-1" onClick={() => setMode('register')}>
              Register
            </Button>
          </div>

          {/* Forms */}
          {mode === 'login' ? <LoginForm onSwitchToRegister={() => setMode('register')} /> : <RegisterForm onSwitchToLogin={() => setMode('login')} />}
        </div>
      </div>
    </div>;
};
export default Auth;
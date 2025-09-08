import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
interface LoginFormProps {
  onSwitchToRegister: () => void;
}
export const LoginForm = ({
  onSwitchToRegister
}: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const {
    signIn,
    resetPassword,
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link');
        } else {
          setError(error.message);
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in."
        });

        // Wait for profile to be available, then redirect to home
        setTimeout(() => {
          // Redirect to home page
          window.location.href = '/home';
        }, 100);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    if (!resetEmail) {
      setError('Please enter your email address');
      setResetLoading(false);
      return;
    }
    try {
      const {
        error
      } = await resetPassword(resetEmail);
      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Reset link sent!",
          description: "Check your email for password reset instructions."
        });
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setResetLoading(false);
    }
  };
  if (showForgotPassword) {
    return <Card>
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {error && <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>}

            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Enter your email" required />
            </div>

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgotPassword(false)}>
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader className="bg-[#000a00]">
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-zinc-950">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="link" className="px-0 text-sm" onClick={() => setShowForgotPassword(true)}>
              Forgot password?
            </Button>
          </div>

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onSwitchToRegister}>
              Don't have an account? Sign up
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>;
};
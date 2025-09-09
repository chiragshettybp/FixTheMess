import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Upload, Eye, EyeOff } from 'lucide-react';

const govRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  designation: z.string().min(1, 'Please select a designation'),
  regionId: z.string().min(1, 'Please select a region'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type GovRegisterFormData = z.infer<typeof govRegisterSchema>;

interface Region {
  id: string;
  name: string;
  state: string;
  district: string | null;
}

interface GovRegisterFormProps {
  onSwitchToLogin: () => void;
}

const designations = [
  'Commissioner',
  'Inspector',
  'Local Body Officer',
  'Municipal Officer',
  'District Collector',
  'Sub-Divisional Officer',
  'Block Development Officer',
  'Ward Officer',
  'Other'
];

export const GovRegisterForm = ({ onSwitchToLogin }: GovRegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GovRegisterFormData>({
    resolver: zodResolver(govRegisterSchema),
  });

  const watchedDesignation = watch('designation');
  const watchedRegion = watch('regionId');

  // Fetch regions on component mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const { data, error } = await supabase
          .from('regions')
          .select('*')
          .order('state', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching regions:', error);
          return;
        }

        setRegions(data || []);
      } catch (err) {
        console.error('Error fetching regions:', err);
      }
    };

    fetchRegions();
  }, []);

  const uploadGovId = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/gov-id.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('government-docs')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('government-docs')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading government ID:', err);
      return null;
    }
  };

  const onSubmit = async (data: GovRegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Register user with government role
      const { error: signUpError } = await signUp(
        data.email,
        data.password,
        data.fullName,
        'government'
      );

      if (signUpError) {
        setError(signUpError.message || 'Registration failed');
        return;
      }

      // Check if email confirmation is required
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Email confirmation is required - show success message
        setError('Registration successful! Please check your email to confirm your account, then try logging in.');
        return;
      }

      // User is immediately available (email confirmation disabled)
      // Upload government ID if provided
      let govIdUrl = null;
      if (govIdFile) {
        govIdUrl = await uploadGovId(govIdFile, user.id);
      }

      // Create government user profile
      const { error: profileError } = await supabase
        .from('government_users')
        .insert({
          user_id: user.id,
          full_name: data.fullName,
          designation: data.designation,
          region_id: data.regionId,
          government_id_url: govIdUrl
        });

      if (profileError) {
        console.error('Error creating government profile:', profileError);
        setError('Failed to create government profile');
        return;
      }

      // Small delay to ensure profile is loaded before navigation
      setTimeout(() => {
        navigate('/gov-panel');
      }, 100);
    } catch (err) {
      setError('An unexpected error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image (JPEG, PNG) or PDF file');
        return;
      }

      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }

      setGovIdFile(file);
      setError(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Government Officer Registration</h2>
        <p className="text-muted-foreground mt-2">
          Register to access the government dashboard
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            {...register('fullName')}
            disabled={loading}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Official Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="officer@government.in"
            {...register('email')}
            disabled={loading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              {...register('password')}
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="designation">Designation</Label>
          <Select
            value={watchedDesignation || ''}
            onValueChange={(value) => setValue('designation', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your designation" />
            </SelectTrigger>
            <SelectContent>
              {designations.map((designation) => (
                <SelectItem key={designation} value={designation}>
                  {designation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.designation && (
            <p className="text-sm text-destructive">{errors.designation.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Region / Ward</Label>
          <Select
            value={watchedRegion || ''}
            onValueChange={(value) => setValue('regionId', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}, {region.state}
                  {region.district && ` - ${region.district}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.regionId && (
            <p className="text-sm text-destructive">{errors.regionId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="govId">Government ID Upload (Optional)</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="govId"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('govId')?.click()}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>{govIdFile ? govIdFile.name : 'Choose File'}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload your government ID (Image or PDF, max 5MB)
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register Government Account'}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have a government account?{' '}
          <Button
            variant="link"
            className="p-0 h-auto font-semibold text-primary"
            onClick={onSwitchToLogin}
            disabled={loading}
          >
            Login Here
          </Button>
        </p>
      </div>
    </div>
  );
};
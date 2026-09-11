import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, Save, RefreshCw } from 'lucide-react';
import { useSettingsManagement } from '@/hooks/useSettingsManagement';
import { useAuth } from '@/hooks/useAuth';

const securitySettingsSchema = z.object({
  password_min_length: z.number().min(8, 'Minimum 8 characters').max(32, 'Maximum 32 characters'),
  password_require_uppercase: z.boolean(),
  password_require_numbers: z.boolean(),
  password_require_symbols: z.boolean(),
  session_timeout_minutes: z.number().min(15, 'Minimum 15 minutes').max(1440, 'Maximum 24 hours'),
  max_login_attempts: z.number().min(3, 'Minimum 3 attempts').max(10, 'Maximum 10 attempts'),
  lockout_duration_minutes: z.number().min(5, 'Minimum 5 minutes').max(60, 'Maximum 60 minutes'),
  require_email_verification: z.boolean(),
  two_factor_auth_enabled: z.boolean(),
  allow_anonymous_reports: z.boolean(),
  ip_rate_limit_per_hour: z.number().min(10, 'Minimum 10 requests').max(1000, 'Maximum 1000 requests'),
});

type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

export const SecuritySettingsSection: React.FC = () => {
  const { profile } = useAuth();
  const { getSettingValue, updateSetting, isLoading } = useSettingsManagement();
  
  const form = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      password_min_length: getSettingValue('password_min_length', 8),
      password_require_uppercase: getSettingValue('password_require_uppercase', true),
      password_require_numbers: getSettingValue('password_require_numbers', true),
      password_require_symbols: getSettingValue('password_require_symbols', false),
      session_timeout_minutes: getSettingValue('session_timeout_minutes', 480),
      max_login_attempts: getSettingValue('max_login_attempts', 5),
      lockout_duration_minutes: getSettingValue('lockout_duration_minutes', 15),
      require_email_verification: getSettingValue('require_email_verification', true),
      two_factor_auth_enabled: getSettingValue('two_factor_auth_enabled', false),
      allow_anonymous_reports: getSettingValue('allow_anonymous_reports', true),
      ip_rate_limit_per_hour: getSettingValue('ip_rate_limit_per_hour', 100),
    },
  });

  const onSubmit = async (data: SecuritySettingsFormData) => {
    if (!profile?.id) return;

    try {
      await Promise.all(
        Object.entries(data).map(([key, value]) =>
          updateSetting(key, value, profile.id, `Security setting: ${key}`)
        )
      );
    } catch (error) {
      console.error('Error updating security settings:', error);
    }
  };

  const resetToDefaults = () => {
    form.reset({
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_numbers: true,
      password_require_symbols: false,
      session_timeout_minutes: 480,
      max_login_attempts: 5,
      lockout_duration_minutes: 15,
      require_email_verification: true,
      two_factor_auth_enabled: false,
      allow_anonymous_reports: true,
      ip_rate_limit_per_hour: 100,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Password Policy */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Password Policy</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password_min_length">Minimum Password Length</Label>
                <Input
                  id="password_min_length"
                  type="number"
                  {...form.register('password_min_length', { valueAsNumber: true })}
                  min={8}
                  max={32}
                />
                {form.formState.errors.password_min_length && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password_min_length.message}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password_require_uppercase">Require Uppercase Letters</Label>
                  <Switch
                    id="password_require_uppercase"
                    checked={form.watch('password_require_uppercase')}
                    onCheckedChange={(checked) => form.setValue('password_require_uppercase', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="password_require_numbers">Require Numbers</Label>
                  <Switch
                    id="password_require_numbers"
                    checked={form.watch('password_require_numbers')}
                    onCheckedChange={(checked) => form.setValue('password_require_numbers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="password_require_symbols">Require Special Characters</Label>
                  <Switch
                    id="password_require_symbols"
                    checked={form.watch('password_require_symbols')}
                    onCheckedChange={(checked) => form.setValue('password_require_symbols', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Session Management */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Session Management</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="session_timeout_minutes">Session Timeout (minutes)</Label>
                <Input
                  id="session_timeout_minutes"
                  type="number"
                  {...form.register('session_timeout_minutes', { valueAsNumber: true })}
                  min={15}
                  max={1440}
                />
                {form.formState.errors.session_timeout_minutes && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.session_timeout_minutes.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                <Input
                  id="max_login_attempts"
                  type="number"
                  {...form.register('max_login_attempts', { valueAsNumber: true })}
                  min={3}
                  max={10}
                />
                {form.formState.errors.max_login_attempts && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.max_login_attempts.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockout_duration_minutes">Lockout Duration (minutes)</Label>
                <Input
                  id="lockout_duration_minutes"
                  type="number"
                  {...form.register('lockout_duration_minutes', { valueAsNumber: true })}
                  min={5}
                  max={60}
                />
                {form.formState.errors.lockout_duration_minutes && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.lockout_duration_minutes.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Authentication Options */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Authentication Options</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require_email_verification">Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">Users must verify email before accessing the platform</p>
                </div>
                <Switch
                  id="require_email_verification"
                  checked={form.watch('require_email_verification')}
                  onCheckedChange={(checked) => form.setValue('require_email_verification', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two_factor_auth_enabled">Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Allow users to enable 2FA for additional security</p>
                </div>
                <Switch
                  id="two_factor_auth_enabled"
                  checked={form.watch('two_factor_auth_enabled')}
                  onCheckedChange={(checked) => form.setValue('two_factor_auth_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow_anonymous_reports">Allow Anonymous Reports</Label>
                  <p className="text-sm text-muted-foreground">Allow users to submit reports without creating an account</p>
                </div>
                <Switch
                  id="allow_anonymous_reports"
                  checked={form.watch('allow_anonymous_reports')}
                  onCheckedChange={(checked) => form.setValue('allow_anonymous_reports', checked)}
                />
              </div>
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Rate Limiting</h4>
            
            <div className="space-y-2">
              <Label htmlFor="ip_rate_limit_per_hour">Requests per IP per Hour</Label>
              <Input
                id="ip_rate_limit_per_hour"
                type="number"
                {...form.register('ip_rate_limit_per_hour', { valueAsNumber: true })}
                min={10}
                max={1000}
              />
              {form.formState.errors.ip_rate_limit_per_hour && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.ip_rate_limit_per_hour.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Maximum number of API requests allowed per IP address per hour
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={resetToDefaults}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
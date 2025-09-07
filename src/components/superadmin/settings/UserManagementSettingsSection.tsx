import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Save, RefreshCw } from 'lucide-react';
import { useSettingsManagement } from '@/hooks/useSettingsManagement';
import { useAuth } from '@/hooks/useAuth';

const userManagementSettingsSchema = z.object({
  max_reports_per_user_per_day: z.number().min(1, 'Minimum 1 report').max(50, 'Maximum 50 reports'),
  auto_suspend_after_strikes: z.number().min(3, 'Minimum 3 strikes').max(10, 'Maximum 10 strikes'),
  strike_expiry_days: z.number().min(7, 'Minimum 7 days').max(365, 'Maximum 365 days'),
  allow_user_profile_editing: z.boolean(),
  require_profile_completion: z.boolean(),
  enable_user_verification: z.boolean(),
  user_deletion_grace_period_days: z.number().min(1, 'Minimum 1 day').max(90, 'Maximum 90 days'),
  automatic_moderation_enabled: z.boolean(),
  content_filter_strictness: z.enum(['low', 'medium', 'high']),
  minimum_report_description_length: z.number().min(10, 'Minimum 10 characters').max(500, 'Maximum 500 characters'),
  enable_community_voting: z.boolean(),
  vote_weight_verified_users: z.number().min(1, 'Minimum 1x').max(5, 'Maximum 5x'),
  auto_escalate_high_voted_reports: z.boolean(),
  escalation_vote_threshold: z.number().min(5, 'Minimum 5 votes').max(100, 'Maximum 100 votes'),
});

type UserManagementSettingsFormData = z.infer<typeof userManagementSettingsSchema>;

export const UserManagementSettingsSection: React.FC = () => {
  const { profile } = useAuth();
  const { getSettingValue, updateSetting, isLoading } = useSettingsManagement();
  
  const form = useForm<UserManagementSettingsFormData>({
    resolver: zodResolver(userManagementSettingsSchema),
    defaultValues: {
      max_reports_per_user_per_day: getSettingValue('max_reports_per_user_per_day', 10),
      auto_suspend_after_strikes: getSettingValue('auto_suspend_after_strikes', 5),
      strike_expiry_days: getSettingValue('strike_expiry_days', 30),
      allow_user_profile_editing: getSettingValue('allow_user_profile_editing', true),
      require_profile_completion: getSettingValue('require_profile_completion', false),
      enable_user_verification: getSettingValue('enable_user_verification', true),
      user_deletion_grace_period_days: getSettingValue('user_deletion_grace_period_days', 30),
      automatic_moderation_enabled: getSettingValue('automatic_moderation_enabled', true),
      content_filter_strictness: getSettingValue('content_filter_strictness', 'medium'),
      minimum_report_description_length: getSettingValue('minimum_report_description_length', 50),
      enable_community_voting: getSettingValue('enable_community_voting', true),
      vote_weight_verified_users: getSettingValue('vote_weight_verified_users', 2),
      auto_escalate_high_voted_reports: getSettingValue('auto_escalate_high_voted_reports', true),
      escalation_vote_threshold: getSettingValue('escalation_vote_threshold', 25),
    },
  });

  const onSubmit = async (data: UserManagementSettingsFormData) => {
    if (!profile?.id) return;

    try {
      await Promise.all(
        Object.entries(data).map(([key, value]) =>
          updateSetting(key, value, profile.id, `User management setting: ${key}`)
        )
      );
    } catch (error) {
      console.error('Error updating user management settings:', error);
    }
  };

  const resetToDefaults = () => {
    form.reset({
      max_reports_per_user_per_day: 10,
      auto_suspend_after_strikes: 5,
      strike_expiry_days: 30,
      allow_user_profile_editing: true,
      require_profile_completion: false,
      enable_user_verification: true,
      user_deletion_grace_period_days: 30,
      automatic_moderation_enabled: true,
      content_filter_strictness: 'medium',
      minimum_report_description_length: 50,
      enable_community_voting: true,
      vote_weight_verified_users: 2,
      auto_escalate_high_voted_reports: true,
      escalation_vote_threshold: 25,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* User Limits */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">User Limits & Restrictions</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="max_reports_per_user_per_day">Max Reports per User per Day</Label>
                <Input
                  id="max_reports_per_user_per_day"
                  type="number"
                  {...form.register('max_reports_per_user_per_day', { valueAsNumber: true })}
                  min={1}
                  max={50}
                />
                {form.formState.errors.max_reports_per_user_per_day && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.max_reports_per_user_per_day.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto_suspend_after_strikes">Auto-Suspend After Strikes</Label>
                <Input
                  id="auto_suspend_after_strikes"
                  type="number"
                  {...form.register('auto_suspend_after_strikes', { valueAsNumber: true })}
                  min={3}
                  max={10}
                />
                {form.formState.errors.auto_suspend_after_strikes && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.auto_suspend_after_strikes.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="strike_expiry_days">Strike Expiry (days)</Label>
                <Input
                  id="strike_expiry_days"
                  type="number"
                  {...form.register('strike_expiry_days', { valueAsNumber: true })}
                  min={7}
                  max={365}
                />
                {form.formState.errors.strike_expiry_days && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.strike_expiry_days.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Management */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Profile Management</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow_user_profile_editing">Allow Profile Editing</Label>
                  <p className="text-sm text-muted-foreground">Users can edit their own profiles</p>
                </div>
                <Switch
                  id="allow_user_profile_editing"
                  checked={form.watch('allow_user_profile_editing')}
                  onCheckedChange={(checked) => form.setValue('allow_user_profile_editing', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require_profile_completion">Require Profile Completion</Label>
                  <p className="text-sm text-muted-foreground">Users must complete profile before reporting</p>
                </div>
                <Switch
                  id="require_profile_completion"
                  checked={form.watch('require_profile_completion')}
                  onCheckedChange={(checked) => form.setValue('require_profile_completion', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable_user_verification">Enable User Verification</Label>
                  <p className="text-sm text-muted-foreground">Allow users to verify their identities</p>
                </div>
                <Switch
                  id="enable_user_verification"
                  checked={form.watch('enable_user_verification')}
                  onCheckedChange={(checked) => form.setValue('enable_user_verification', checked)}
                />
              </div>
            </div>
          </div>

          {/* Content Moderation */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Content Moderation</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="content_filter_strictness">Content Filter Strictness</Label>
                <Select
                  value={form.watch('content_filter_strictness')}
                  onValueChange={(value) => form.setValue('content_filter_strictness', value as 'low' | 'medium' | 'high')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Basic filtering</SelectItem>
                    <SelectItem value="medium">Medium - Moderate filtering</SelectItem>
                    <SelectItem value="high">High - Strict filtering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_report_description_length">Min Report Description Length</Label>
                <Input
                  id="minimum_report_description_length"
                  type="number"
                  {...form.register('minimum_report_description_length', { valueAsNumber: true })}
                  min={10}
                  max={500}
                />
                {form.formState.errors.minimum_report_description_length && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.minimum_report_description_length.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="automatic_moderation_enabled">Automatic Moderation</Label>
                <p className="text-sm text-muted-foreground">Enable AI-powered content moderation</p>
              </div>
              <Switch
                id="automatic_moderation_enabled"
                checked={form.watch('automatic_moderation_enabled')}
                onCheckedChange={(checked) => form.setValue('automatic_moderation_enabled', checked)}
              />
            </div>
          </div>

          {/* Community Features */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Community Features</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable_community_voting">Enable Community Voting</Label>
                  <p className="text-sm text-muted-foreground">Allow users to vote on reports</p>
                </div>
                <Switch
                  id="enable_community_voting"
                  checked={form.watch('enable_community_voting')}
                  onCheckedChange={(checked) => form.setValue('enable_community_voting', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vote_weight_verified_users">Vote Weight for Verified Users</Label>
                  <Input
                    id="vote_weight_verified_users"
                    type="number"
                    {...form.register('vote_weight_verified_users', { valueAsNumber: true })}
                    min={1}
                    max={5}
                  />
                  {form.formState.errors.vote_weight_verified_users && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.vote_weight_verified_users.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escalation_vote_threshold">Escalation Vote Threshold</Label>
                  <Input
                    id="escalation_vote_threshold"
                    type="number"
                    {...form.register('escalation_vote_threshold', { valueAsNumber: true })}
                    min={5}
                    max={100}
                  />
                  {form.formState.errors.escalation_vote_threshold && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.escalation_vote_threshold.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_deletion_grace_period_days">Deletion Grace Period (days)</Label>
                  <Input
                    id="user_deletion_grace_period_days"
                    type="number"
                    {...form.register('user_deletion_grace_period_days', { valueAsNumber: true })}
                    min={1}
                    max={90}
                  />
                  {form.formState.errors.user_deletion_grace_period_days && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.user_deletion_grace_period_days.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_escalate_high_voted_reports">Auto-Escalate High-Voted Reports</Label>
                  <p className="text-sm text-muted-foreground">Automatically escalate reports that reach vote threshold</p>
                </div>
                <Switch
                  id="auto_escalate_high_voted_reports"
                  checked={form.watch('auto_escalate_high_voted_reports')}
                  onCheckedChange={(checked) => form.setValue('auto_escalate_high_voted_reports', checked)}
                />
              </div>
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
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Save, RefreshCw } from 'lucide-react';
import { useSettingsManagement } from '@/hooks/useSettingsManagement';
import { useAuth } from '@/hooks/useAuth';

const notificationSettingsSchema = z.object({
  email_notifications_enabled: z.boolean(),
  sms_notifications_enabled: z.boolean(),
  push_notifications_enabled: z.boolean(),
  notification_frequency_hours: z.number().min(1, 'Minimum 1 hour').max(168, 'Maximum 7 days'),
  welcome_email_template: z.string().optional(),
  report_status_update_template: z.string().optional(),
  weekly_digest_enabled: z.boolean(),
  admin_alert_threshold: z.number().min(1, 'Minimum 1 report').max(100, 'Maximum 100 reports'),
  escalation_notification_delay_hours: z.number().min(1, 'Minimum 1 hour').max(72, 'Maximum 3 days'),
  bulk_notification_limit: z.number().min(10, 'Minimum 10 users').max(10000, 'Maximum 10,000 users'),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

export const NotificationSettingsSection: React.FC = () => {
  const { profile } = useAuth();
  const { getSettingValue, updateSetting, isLoading } = useSettingsManagement();
  
  const form = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      email_notifications_enabled: getSettingValue('email_notifications_enabled', true),
      sms_notifications_enabled: getSettingValue('sms_notifications_enabled', false),
      push_notifications_enabled: getSettingValue('push_notifications_enabled', true),
      notification_frequency_hours: getSettingValue('notification_frequency_hours', 24),
      welcome_email_template: getSettingValue('welcome_email_template', ''),
      report_status_update_template: getSettingValue('report_status_update_template', ''),
      weekly_digest_enabled: getSettingValue('weekly_digest_enabled', true),
      admin_alert_threshold: getSettingValue('admin_alert_threshold', 10),
      escalation_notification_delay_hours: getSettingValue('escalation_notification_delay_hours', 24),
      bulk_notification_limit: getSettingValue('bulk_notification_limit', 1000),
    },
  });

  const onSubmit = async (data: NotificationSettingsFormData) => {
    if (!profile?.id) return;

    try {
      await Promise.all(
        Object.entries(data).map(([key, value]) =>
          updateSetting(key, value, profile.id, `Notification setting: ${key}`)
        )
      );
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const resetToDefaults = () => {
    form.reset({
      email_notifications_enabled: true,
      sms_notifications_enabled: false,
      push_notifications_enabled: true,
      notification_frequency_hours: 24,
      welcome_email_template: '',
      report_status_update_template: '',
      weekly_digest_enabled: true,
      admin_alert_threshold: 10,
      escalation_notification_delay_hours: 24,
      bulk_notification_limit: 1000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Global Notification Toggles */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Global Notification Controls</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications_enabled">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Enable system-wide email notifications</p>
                </div>
                <Switch
                  id="email_notifications_enabled"
                  checked={form.watch('email_notifications_enabled')}
                  onCheckedChange={(checked) => form.setValue('email_notifications_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms_notifications_enabled">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Enable SMS notifications for critical alerts</p>
                </div>
                <Switch
                  id="sms_notifications_enabled"
                  checked={form.watch('sms_notifications_enabled')}
                  onCheckedChange={(checked) => form.setValue('sms_notifications_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push_notifications_enabled">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Enable browser push notifications</p>
                </div>
                <Switch
                  id="push_notifications_enabled"
                  checked={form.watch('push_notifications_enabled')}
                  onCheckedChange={(checked) => form.setValue('push_notifications_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly_digest_enabled">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Send weekly activity summaries to users</p>
                </div>
                <Switch
                  id="weekly_digest_enabled"
                  checked={form.watch('weekly_digest_enabled')}
                  onCheckedChange={(checked) => form.setValue('weekly_digest_enabled', checked)}
                />
              </div>
            </div>
          </div>

          {/* Notification Timing */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Notification Timing</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="notification_frequency_hours">Notification Frequency (hours)</Label>
                <Input
                  id="notification_frequency_hours"
                  type="number"
                  {...form.register('notification_frequency_hours', { valueAsNumber: true })}
                  min={1}
                  max={168}
                />
                {form.formState.errors.notification_frequency_hours && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.notification_frequency_hours.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="escalation_notification_delay_hours">Escalation Delay (hours)</Label>
                <Input
                  id="escalation_notification_delay_hours"
                  type="number"
                  {...form.register('escalation_notification_delay_hours', { valueAsNumber: true })}
                  min={1}
                  max={72}
                />
                {form.formState.errors.escalation_notification_delay_hours && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.escalation_notification_delay_hours.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Hours before escalating unaddressed reports
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_alert_threshold">Admin Alert Threshold</Label>
                <Input
                  id="admin_alert_threshold"
                  type="number"
                  {...form.register('admin_alert_threshold', { valueAsNumber: true })}
                  min={1}
                  max={100}
                />
                {form.formState.errors.admin_alert_threshold && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.admin_alert_threshold.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Number of pending reports to trigger admin alert
                </p>
              </div>
            </div>
          </div>

          {/* Email Templates */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Email Templates</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome_email_template">Welcome Email Template</Label>
                <Textarea
                  id="welcome_email_template"
                  {...form.register('welcome_email_template')}
                  placeholder="Welcome to {app_name}! Thank you for joining our community..."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Available variables: {'{app_name}'}, {'{user_name}'}, {'{support_email}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report_status_update_template">Report Status Update Template</Label>
                <Textarea
                  id="report_status_update_template"
                  {...form.register('report_status_update_template')}
                  placeholder="Your report '{report_title}' has been updated to status: {status}..."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Available variables: {'{report_title}'}, {'{status}'}, {'{user_name}'}, {'{update_message}'}
                </p>
              </div>
            </div>
          </div>

          {/* Bulk Operations */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Bulk Operations</h4>
            
            <div className="space-y-2">
              <Label htmlFor="bulk_notification_limit">Bulk Notification Limit</Label>
              <Input
                id="bulk_notification_limit"
                type="number"
                {...form.register('bulk_notification_limit', { valueAsNumber: true })}
                min={10}
                max={10000}
              />
              {form.formState.errors.bulk_notification_limit && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.bulk_notification_limit.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Maximum number of users that can receive notifications in a single batch
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
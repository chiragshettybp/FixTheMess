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
import { BarChart3, Save, RefreshCw } from 'lucide-react';
import { useSettingsManagement } from '@/hooks/useSettingsManagement';
import { useAuth } from '@/hooks/useAuth';

const analyticsSettingsSchema = z.object({
  analytics_enabled: z.boolean(),
  data_retention_days: z.number().min(30, 'Minimum 30 days').max(2555, 'Maximum 7 years'),
  anonymous_analytics: z.boolean(),
  user_behavior_tracking: z.boolean(),
  performance_monitoring: z.boolean(),
  error_reporting: z.boolean(),
  export_data_format: z.enum(['csv', 'json', 'xlsx']),
  automated_reports_enabled: z.boolean(),
  report_frequency: z.enum(['daily', 'weekly', 'monthly']),
  dashboard_refresh_interval_seconds: z.number().min(30, 'Minimum 30 seconds').max(300, 'Maximum 5 minutes'),
  real_time_analytics: z.boolean(),
  gdpr_compliance_mode: z.boolean(),
  analytics_consent_required: z.boolean(),
  custom_events_enabled: z.boolean(),
  heatmap_tracking: z.boolean(),
  session_recording_enabled: z.boolean(),
});

type AnalyticsSettingsFormData = z.infer<typeof analyticsSettingsSchema>;

export const AnalyticsSettingsSection: React.FC = () => {
  const { profile } = useAuth();
  const { getSettingValue, updateSetting, isLoading } = useSettingsManagement();
  
  const form = useForm<AnalyticsSettingsFormData>({
    resolver: zodResolver(analyticsSettingsSchema),
    defaultValues: {
      analytics_enabled: getSettingValue('analytics_enabled', true),
      data_retention_days: getSettingValue('data_retention_days', 365),
      anonymous_analytics: getSettingValue('anonymous_analytics', true),
      user_behavior_tracking: getSettingValue('user_behavior_tracking', true),
      performance_monitoring: getSettingValue('performance_monitoring', true),
      error_reporting: getSettingValue('error_reporting', true),
      export_data_format: getSettingValue('export_data_format', 'csv'),
      automated_reports_enabled: getSettingValue('automated_reports_enabled', false),
      report_frequency: getSettingValue('report_frequency', 'weekly'),
      dashboard_refresh_interval_seconds: getSettingValue('dashboard_refresh_interval_seconds', 60),
      real_time_analytics: getSettingValue('real_time_analytics', true),
      gdpr_compliance_mode: getSettingValue('gdpr_compliance_mode', false),
      analytics_consent_required: getSettingValue('analytics_consent_required', false),
      custom_events_enabled: getSettingValue('custom_events_enabled', true),
      heatmap_tracking: getSettingValue('heatmap_tracking', false),
      session_recording_enabled: getSettingValue('session_recording_enabled', false),
    },
  });

  const onSubmit = async (data: AnalyticsSettingsFormData) => {
    if (!profile?.id) return;

    try {
      await Promise.all(
        Object.entries(data).map(([key, value]) =>
          updateSetting(key, value, profile.id, `Analytics setting: ${key}`)
        )
      );
    } catch (error) {
      console.error('Error updating analytics settings:', error);
    }
  };

  const resetToDefaults = () => {
    form.reset({
      analytics_enabled: true,
      data_retention_days: 365,
      anonymous_analytics: true,
      user_behavior_tracking: true,
      performance_monitoring: true,
      error_reporting: true,
      export_data_format: 'csv',
      automated_reports_enabled: false,
      report_frequency: 'weekly',
      dashboard_refresh_interval_seconds: 60,
      real_time_analytics: true,
      gdpr_compliance_mode: false,
      analytics_consent_required: false,
      custom_events_enabled: true,
      heatmap_tracking: false,
      session_recording_enabled: false,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Core Analytics */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Core Analytics</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics_enabled">Enable Analytics</Label>
                  <p className="text-sm text-muted-foreground">Master toggle for all analytics collection</p>
                </div>
                <Switch
                  id="analytics_enabled"
                  checked={form.watch('analytics_enabled')}
                  onCheckedChange={(checked) => form.setValue('analytics_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="anonymous_analytics">Anonymous Analytics</Label>
                  <p className="text-sm text-muted-foreground">Collect analytics without personally identifiable information</p>
                </div>
                <Switch
                  id="anonymous_analytics"
                  checked={form.watch('anonymous_analytics')}
                  onCheckedChange={(checked) => form.setValue('anonymous_analytics', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="real_time_analytics">Real-time Analytics</Label>
                  <p className="text-sm text-muted-foreground">Enable real-time data processing and updates</p>
                </div>
                <Switch
                  id="real_time_analytics"
                  checked={form.watch('real_time_analytics')}
                  onCheckedChange={(checked) => form.setValue('real_time_analytics', checked)}
                />
              </div>
            </div>
          </div>

          {/* Data Collection */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Data Collection</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="user_behavior_tracking">User Behavior Tracking</Label>
                  <p className="text-sm text-muted-foreground">Track user interactions and navigation patterns</p>
                </div>
                <Switch
                  id="user_behavior_tracking"
                  checked={form.watch('user_behavior_tracking')}
                  onCheckedChange={(checked) => form.setValue('user_behavior_tracking', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="performance_monitoring">Performance Monitoring</Label>
                  <p className="text-sm text-muted-foreground">Monitor application performance metrics</p>
                </div>
                <Switch
                  id="performance_monitoring"
                  checked={form.watch('performance_monitoring')}
                  onCheckedChange={(checked) => form.setValue('performance_monitoring', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="error_reporting">Error Reporting</Label>
                  <p className="text-sm text-muted-foreground">Automatically report application errors</p>
                </div>
                <Switch
                  id="error_reporting"
                  checked={form.watch('error_reporting')}
                  onCheckedChange={(checked) => form.setValue('error_reporting', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="custom_events_enabled">Custom Events</Label>
                  <p className="text-sm text-muted-foreground">Enable custom event tracking</p>
                </div>
                <Switch
                  id="custom_events_enabled"
                  checked={form.watch('custom_events_enabled')}
                  onCheckedChange={(checked) => form.setValue('custom_events_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="heatmap_tracking">Heatmap Tracking</Label>
                  <p className="text-sm text-muted-foreground">Track user click and scroll patterns</p>
                </div>
                <Switch
                  id="heatmap_tracking"
                  checked={form.watch('heatmap_tracking')}
                  onCheckedChange={(checked) => form.setValue('heatmap_tracking', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="session_recording_enabled">Session Recording</Label>
                  <p className="text-sm text-muted-foreground">Record user sessions for analysis</p>
                </div>
                <Switch
                  id="session_recording_enabled"
                  checked={form.watch('session_recording_enabled')}
                  onCheckedChange={(checked) => form.setValue('session_recording_enabled', checked)}
                />
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Data Management</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="data_retention_days">Data Retention (days)</Label>
                <Input
                  id="data_retention_days"
                  type="number"
                  {...form.register('data_retention_days', { valueAsNumber: true })}
                  min={30}
                  max={2555}
                />
                {form.formState.errors.data_retention_days && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.data_retention_days.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="export_data_format">Export Data Format</Label>
                <Select
                  value={form.watch('export_data_format')}
                  onValueChange={(value) => form.setValue('export_data_format', value as 'csv' | 'json' | 'xlsx')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dashboard_refresh_interval_seconds">Dashboard Refresh (seconds)</Label>
                <Input
                  id="dashboard_refresh_interval_seconds"
                  type="number"
                  {...form.register('dashboard_refresh_interval_seconds', { valueAsNumber: true })}
                  min={30}
                  max={300}
                />
                {form.formState.errors.dashboard_refresh_interval_seconds && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.dashboard_refresh_interval_seconds.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Automated Reporting */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Automated Reporting</h4>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label htmlFor="automated_reports_enabled">Enable Automated Reports</Label>
                <p className="text-sm text-muted-foreground">Send automated analytics reports to administrators</p>
              </div>
              <Switch
                id="automated_reports_enabled"
                checked={form.watch('automated_reports_enabled')}
                onCheckedChange={(checked) => form.setValue('automated_reports_enabled', checked)}
              />
            </div>

            {form.watch('automated_reports_enabled') && (
              <div className="space-y-2">
                <Label htmlFor="report_frequency">Report Frequency</Label>
                <Select
                  value={form.watch('report_frequency')}
                  onValueChange={(value) => form.setValue('report_frequency', value as 'daily' | 'weekly' | 'monthly')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Privacy & Compliance */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground">Privacy & Compliance</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gdpr_compliance_mode">GDPR Compliance Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable additional privacy controls for GDPR compliance</p>
                </div>
                <Switch
                  id="gdpr_compliance_mode"
                  checked={form.watch('gdpr_compliance_mode')}
                  onCheckedChange={(checked) => form.setValue('gdpr_compliance_mode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics_consent_required">Analytics Consent Required</Label>
                  <p className="text-sm text-muted-foreground">Require user consent before collecting analytics</p>
                </div>
                <Switch
                  id="analytics_consent_required"
                  checked={form.watch('analytics_consent_required')}
                  onCheckedChange={(checked) => form.setValue('analytics_consent_required', checked)}
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
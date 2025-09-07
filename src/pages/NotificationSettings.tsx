import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Bell, Settings, Users, Shield, Mail, Smartphone, Globe } from 'lucide-react';

type DeliveryMethod = 'email' | 'app' | 'both';

interface NotificationSettings {
  id?: string;
  user_id: string;
  report_updates: boolean;
  comment_alerts: boolean;
  resolution_alerts: boolean;
  nearby_alerts: boolean;
  nearby_radius_km: number;
  community_updates: boolean;
  reply_notifications: boolean;
  abuse_report_feedback: boolean;
  delivery_method: DeliveryMethod;
}

const defaultSettings: Omit<NotificationSettings, 'id' | 'user_id'> = {
  report_updates: true,
  comment_alerts: true,
  resolution_alerts: true,
  nearby_alerts: true,
  nearby_radius_km: 5,
  community_updates: true,
  reply_notifications: true,
  abuse_report_feedback: true,
  delivery_method: 'both'
};

export default function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user's notification settings
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading notification settings:', error);
          return;
        }

        if (data) {
          setSettings(data as NotificationSettings);
        } else {
          // Create default settings for new user
          const newSettings = {
            user_id: user.id,
            ...defaultSettings
          };
          setSettings(newSettings);
          await saveSettings(newSettings);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const saveSettings = async (newSettings: NotificationSettings) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          ...newSettings,
          user_id: user.id
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save notification settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const testNotification = () => {
    toast({
      title: "Test notification",
      description: "This is how notifications will appear in the app"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load notification settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">
            Control how and when you receive alerts and updates
          </p>
        </div>
      </div>

      {/* Report Activity Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Report Activity Notifications
          </CardTitle>
          <CardDescription>
            Get notified about activity on your reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="report-updates" className="text-sm font-medium">
              Notify me when my report gets a status update
            </Label>
            <Switch
              id="report-updates"
              checked={settings.report_updates}
              onCheckedChange={(checked) => updateSetting('report_updates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="comment-alerts" className="text-sm font-medium">
              Notify me when someone comments on my report
            </Label>
            <Switch
              id="comment-alerts"
              checked={settings.comment_alerts}
              onCheckedChange={(checked) => updateSetting('comment_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="resolution-alerts" className="text-sm font-medium">
              Notify me when my report is resolved
            </Label>
            <Switch
              id="resolution-alerts"
              checked={settings.resolution_alerts}
              onCheckedChange={(checked) => updateSetting('resolution_alerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Nearby Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Nearby Alerts
          </CardTitle>
          <CardDescription>
            Stay informed about issues in your area
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="nearby-alerts" className="text-sm font-medium">
              Notify me when a new issue is reported near me
            </Label>
            <Switch
              id="nearby-alerts"
              checked={settings.nearby_alerts}
              onCheckedChange={(checked) => updateSetting('nearby_alerts', checked)}
            />
          </div>

          {settings.nearby_alerts && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Alert radius: {settings.nearby_radius_km}km
              </Label>
              <Slider
                value={[settings.nearby_radius_km]}
                onValueChange={(value) => updateSetting('nearby_radius_km', value[0])}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1km</span>
                <span>25km</span>
                <span>50km</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Participation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Participation
          </CardTitle>
          <CardDescription>
            Notifications about community interactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="community-updates" className="text-sm font-medium">
              Send me updates from groups or comments I follow
            </Label>
            <Switch
              id="community-updates"
              checked={settings.community_updates}
              onCheckedChange={(checked) => updateSetting('community_updates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="reply-notifications" className="text-sm font-medium">
              Notify me when someone replies to my comment
            </Label>
            <Switch
              id="reply-notifications"
              checked={settings.reply_notifications}
              onCheckedChange={(checked) => updateSetting('reply_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Abuse Reports Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Abuse Reports Feedback
          </CardTitle>
          <CardDescription>
            Get updates on reports you've flagged
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="abuse-feedback" className="text-sm font-medium">
              Notify me when action is taken on my abuse report
            </Label>
            <Switch
              id="abuse-feedback"
              checked={settings.abuse_report_feedback}
              onCheckedChange={(checked) => updateSetting('abuse_report_feedback', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Method */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Method</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.delivery_method}
            onValueChange={(value: DeliveryMethod) => updateSetting('delivery_method', value)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="email" />
              <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4" />
                Email only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="app" id="app" />
              <Label htmlFor="app" className="flex items-center gap-2 cursor-pointer">
                <Smartphone className="h-4 w-4" />
                In-app only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer">
                <Bell className="h-4 w-4" />
                Both email and in-app
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Test Notification */}
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Send yourself a test notification to see how they appear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testNotification}
            variant="outline"
            className="w-full"
          >
            Send Test Notification
          </Button>
        </CardContent>
      </Card>

      {saving && (
        <div className="fixed bottom-4 right-4">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
            Saving...
          </div>
        </div>
      )}
    </div>
  );
}
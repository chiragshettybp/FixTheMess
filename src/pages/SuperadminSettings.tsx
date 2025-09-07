import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Bell, Users, BarChart3, ToggleLeft, History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { GeneralSettingsSection } from '@/components/superadmin/settings/GeneralSettingsSection';
import { SecuritySettingsSection } from '@/components/superadmin/settings/SecuritySettingsSection';
import { NotificationSettingsSection } from '@/components/superadmin/settings/NotificationSettingsSection';
import { UserManagementSettingsSection } from '@/components/superadmin/settings/UserManagementSettingsSection';
import { AnalyticsSettingsSection } from '@/components/superadmin/settings/AnalyticsSettingsSection';
import { FeatureToggleSection } from '@/components/superadmin/settings/FeatureToggleSection';
import { useSettingsManagement } from '@/hooks/useSettingsManagement';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuditLogEntry {
  id: string;
  admin_id: string;
  action_type: string;
  table_name: string;
  changes_summary?: string;
  created_at: string;
}

const SuperadminSettings = () => {
  const { toast } = useToast();
  const { auditLogs, getSettingValue, loadSettings } = useSettingsManagement();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Load current logo from settings
  React.useEffect(() => {
    const logoUrl = getSettingValue('app_logo', null);
    setCurrentLogo(logoUrl);
  }, [getSettingValue]);


  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  };

  const refreshAllSettings = async () => {
    try {
      await loadSettings();
      toast({
        title: "Success",
        description: "Settings refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing settings:', error);
      toast({
        title: "Error",
        description: "Failed to refresh settings",
        variant: "destructive",
      });
    }
  };

  const formatAuditDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      
      
      <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">System Settings</h1>
              <p className="text-muted-foreground">Comprehensive system configuration and management</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={refreshAllSettings}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto">
            <TabsTrigger value="general" className="flex items-center gap-2 py-3">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 py-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 py-3">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2 py-3">
              <ToggleLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <GeneralSettingsSection
              logoPreview={logoPreview}
              currentLogo={currentLogo}
              onLogoChange={handleLogoChange}
              onLogoUpload={uploadLogo}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettingsSection />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettingsSection />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagementSettingsSection />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsSettingsSection />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <FeatureToggleSection />
          </TabsContent>
        </Tabs>

        {/* Settings Audit Trail */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {log.changes_summary || `${log.action_type} on ${log.table_name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAuditDate(log.created_at)}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Admin: {log.admin_id.slice(0, 8)}...
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent changes recorded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperadminSettings;
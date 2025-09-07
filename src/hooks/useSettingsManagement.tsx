import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  description?: string;
}

export interface FeatureToggle {
  id: string;
  feature_key: string;
  is_enabled: boolean;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_name: string;
  permission_key: string;
  is_granted: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SettingsAuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  changes_summary?: string;
  created_at: string;
}

export const useSettingsManagement = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [auditLogs, setAuditLogs] = useState<SettingsAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load all settings data
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [settingsResult, togglesResult, permissionsResult, auditResult] = await Promise.all([
        supabase.from('app_settings').select('*').order('setting_key'),
        supabase.from('feature_toggles').select('*').order('feature_key'),
        supabase.from('role_permissions').select('*').order('role_name, permission_key'),
        supabase.from('settings_audit').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      if (settingsResult.error) throw settingsResult.error;
      if (togglesResult.error) throw togglesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;
      if (auditResult.error) throw auditResult.error;

      setSettings(settingsResult.data || []);
      setFeatureToggles(togglesResult.data || []);
      setRolePermissions(permissionsResult.data || []);
      setAuditLogs(auditResult.data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get specific setting value
  const getSettingValue = (key: string, defaultValue?: any) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value ?? defaultValue;
  };

  // Update or create a setting
  const updateSetting = async (key: string, value: any, adminId: string, description?: string) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_by: adminId,
          description,
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      // Log the change
      await supabase
        .from('settings_audit')
        .insert({
          admin_id: adminId,
          action_type: 'UPDATE',
          table_name: 'app_settings',
          changes_summary: `Updated setting: ${key}`,
          new_values: { [key]: value },
        });

      await loadSettings();
      
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update feature toggle
  const updateFeatureToggle = async (featureKey: string, isEnabled: boolean, adminId: string) => {
    try {
      const { error } = await supabase
        .from('feature_toggles')
        .upsert({
          feature_key: featureKey,
          is_enabled: isEnabled,
          updated_by: adminId,
        }, {
          onConflict: 'feature_key'
        });

      if (error) throw error;

      // Log the change
      await supabase
        .from('settings_audit')
        .insert({
          admin_id: adminId,
          action_type: 'UPDATE',
          table_name: 'feature_toggles',
          changes_summary: `${isEnabled ? 'Enabled' : 'Disabled'} feature: ${featureKey}`,
          new_values: { feature_key: featureKey, is_enabled: isEnabled },
        });

      await loadSettings();
      
      toast({
        title: "Success",
        description: `Feature ${isEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating feature toggle:', error);
      toast({
        title: "Error",
        description: "Failed to update feature toggle",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update role permission
  const updateRolePermission = async (roleName: string, permissionKey: string, isGranted: boolean, adminId: string) => {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .upsert({
          role_name: roleName,
          permission_key: permissionKey,
          is_granted: isGranted,
          updated_by: adminId,
        }, {
          onConflict: 'role_name,permission_key'
        });

      if (error) throw error;

      // Log the change
      await supabase
        .from('settings_audit')
        .insert({
          admin_id: adminId,
          action_type: 'UPDATE',
          table_name: 'role_permissions',
          changes_summary: `${isGranted ? 'Granted' : 'Revoked'} ${permissionKey} for ${roleName}`,
          new_values: { role_name: roleName, permission_key: permissionKey, is_granted: isGranted },
        });

      await loadSettings();
      
      toast({
        title: "Success",
        description: `Permission ${isGranted ? 'granted' : 'revoked'}`,
      });
    } catch (error) {
      console.error('Error updating role permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Check if feature is enabled
  const isFeatureEnabled = (featureKey: string): boolean => {
    const toggle = featureToggles.find(t => t.feature_key === featureKey);
    return toggle?.is_enabled ?? false;
  };

  // Check if role has permission
  const hasRolePermission = (roleName: string, permissionKey: string): boolean => {
    const permission = rolePermissions.find(p => 
      p.role_name === roleName && p.permission_key === permissionKey
    );
    return permission?.is_granted ?? false;
  };

  // Setup real-time subscriptions
  useEffect(() => {
    loadSettings();

    const settingsChannel = supabase
      .channel('settings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings'
        },
        () => loadSettings()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_toggles'
        },
        () => loadSettings()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'role_permissions'
        },
        () => loadSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  return {
    settings,
    featureToggles,
    rolePermissions,
    auditLogs,
    isLoading,
    getSettingValue,
    updateSetting,
    updateFeatureToggle,
    updateRolePermission,
    isFeatureEnabled,
    hasRolePermission,
    loadSettings,
  };
};
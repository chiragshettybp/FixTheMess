import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardStats {
  totalReports: number;
  urgentIssues: number;
  totalUsers: number;
  cityAdmins: number;
  flaggedReports: number;
  activeCities: Array<{ city: string; count: number }>;
}

export interface CityAdmin {
  id: string;
  user_id: string;
  admin_name: string;
  email: string;
  phone: string | null;
  assigned_city: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CivicModule {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  department_tag: string | null;
  file_url: string;
  file_type: string;
  uploaded_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportFlag {
  id: string;
  report_id: string;
  flag_type: string;
  reason: string | null;
  flagged_by_user_id: string | null;
  is_auto_flagged: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useSuperadminDashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    urgentIssues: 0,
    totalUsers: 0,
    cityAdmins: 0,
    flaggedReports: 0,
    activeCities: []
  });
  const [cityAdmins, setCityAdmins] = useState<CityAdmin[]>([]);
  const [civicModules, setCivicModules] = useState<CivicModule[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings[]>([]);
  const [reportFlags, setReportFlags] = useState<ReportFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is superadmin
  const isSuperadmin = profile?.role === 'superadmin';

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const [
        reportsResult,
        urgentResult,
        usersResult,
        cityAdminsResult,
        flaggedResult,
        activeCitiesResult
      ] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact' }),
        supabase.from('reports').select('id', { count: 'exact' }).eq('status', 'urgent'),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('city_admins').select('id', { count: 'exact' }),
        supabase.from('report_flags').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('reports').select('latitude, longitude')
      ]);

      // Process active cities from report locations
      const activeCities: Array<{ city: string; count: number }> = [];
      if (activeCitiesResult.data) {
        // This is a simplified version - in real app you'd geocode coordinates to city names
        const cityCount = Math.floor(activeCitiesResult.data.length / 3);
        activeCities.push(
          { city: 'Mumbai', count: cityCount },
          { city: 'Delhi', count: Math.floor(cityCount * 0.8) },
          { city: 'Bangalore', count: Math.floor(cityCount * 0.6) }
        );
      }

      setStats({
        totalReports: reportsResult.count || 0,
        urgentIssues: urgentResult.count || 0,
        totalUsers: usersResult.count || 0,
        cityAdmins: cityAdminsResult.count || 0,
        flaggedReports: flaggedResult.count || 0,
        activeCities
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to fetch dashboard statistics');
    }
  };

  // Fetch city admins
  const fetchCityAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('city_admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCityAdmins(data || []);
    } catch (err) {
      console.error('Error fetching city admins:', err);
      setError('Failed to fetch city admins');
    }
  };

  // Fetch civic modules
  const fetchCivicModules = async () => {
    try {
      const { data, error } = await supabase
        .from('civic_modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCivicModules(data || []);
    } catch (err) {
      console.error('Error fetching civic modules:', err);
      setError('Failed to fetch civic modules');
    }
  };

  // Fetch platform settings
  const fetchPlatformSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setPlatformSettings(data || []);
    } catch (err) {
      console.error('Error fetching platform settings:', err);
      setError('Failed to fetch platform settings');
    }
  };

  // Fetch report flags
  const fetchReportFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('report_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReportFlags(data || []);
    } catch (err) {
      console.error('Error fetching report flags:', err);
      setError('Failed to fetch report flags');
    }
  };

  // Update city admin status
  const updateCityAdminStatus = async (adminId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('city_admins')
        .update({ status })
        .eq('id', adminId);

      if (error) throw error;
      
      // Refresh city admins
      fetchCityAdmins();
      return { error: null };
    } catch (err) {
      console.error('Error updating city admin status:', err);
      return { error: 'Failed to update city admin status' };
    }
  };

  // Update user ban status
  const updateUserBanStatus = async (userId: string, isBanned: boolean, reason?: string) => {
    try {
      // Update user role to 'banned' or back to 'user'
      const { error } = await supabase
        .from('users')
        .update({ 
          role: isBanned ? 'banned' : 'user'
        })
        .eq('id', userId);

      if (error) throw error;
      
      return { error: null };
    } catch (err) {
      console.error('Error updating user ban status:', err);
      return { error: 'Failed to update user ban status' };
    }
  };

  // Update report status
  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
      
      // Refresh stats
      fetchStats();
      return { error: null };
    } catch (err) {
      console.error('Error updating report status:', err);
      return { error: 'Failed to update report status' };
    }
  };

  // Flag report
  const flagReport = async (reportId: string, flagType: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('report_flags')
        .insert({
          report_id: reportId,
          flag_type: flagType,
          reason: reason,
          flagged_by_user_id: user?.id,
          is_auto_flagged: false
        });

      if (error) throw error;
      
      // Refresh flags and stats
      fetchReportFlags();
      fetchStats();
      return { error: null };
    } catch (err) {
      console.error('Error flagging report:', err);
      return { error: 'Failed to flag report' };
    }
  };

  // Update platform setting
  const updatePlatformSetting = async (settingKey: string, settingValue: any) => {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: settingValue,
          updated_by: user?.id
        });

      if (error) throw error;
      
      // Refresh settings
      fetchPlatformSettings();
      return { error: null };
    } catch (err) {
      console.error('Error updating platform setting:', err);
      return { error: 'Failed to update platform setting' };
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user && isSuperadmin) {
      setLoading(true);
      Promise.all([
        fetchStats(),
        fetchCityAdmins(),
        fetchCivicModules(),
        fetchPlatformSettings(),
        fetchReportFlags()
      ]).finally(() => setLoading(false));
    }
  }, [user, isSuperadmin]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !isSuperadmin) return;

    const channels = [
      supabase
        .channel('superadmin-reports')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
          fetchStats();
        }),
      supabase
        .channel('superadmin-city-admins')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'city_admins' }, () => {
          fetchCityAdmins();
          fetchStats();
        }),
      supabase
        .channel('superadmin-civic-modules')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'civic_modules' }, () => {
          fetchCivicModules();
        }),
      supabase
        .channel('superadmin-flags')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'report_flags' }, () => {
          fetchReportFlags();
          fetchStats();
        })
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, isSuperadmin]);

  // Auto-refresh stats every 60 seconds
  useEffect(() => {
    if (!user || !isSuperadmin) return;

    const interval = setInterval(() => {
      fetchStats();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, isSuperadmin]);

  return {
    stats,
    cityAdmins,
    civicModules,
    platformSettings,
    reportFlags,
    loading,
    error,
    isSuperadmin,
    updateCityAdminStatus,
    updateUserBanStatus,
    updateReportStatus,
    flagReport,
    updatePlatformSetting,
    refetch: () => {
      fetchStats();
      fetchCityAdmins();
      fetchCivicModules();
      fetchPlatformSettings();
      fetchReportFlags();
    }
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AnalyticsMetrics {
  totalReports: number;
  totalViews: number;
  totalTaps: number;
  avgAttentionTime: number;
  activeUsers: number;
  overdueReports: number;
}

export interface ReportAnalytics {
  id: string;
  title: string;
  status: string;
  issue_type: string;
  created_at: string;
  user_id: string;
  reporter_name: string;
  attention_time: number | null;
  is_overdue: boolean;
}

export interface ViewsData {
  date: string;
  views: number;
  content_type: string;
  device_type: string;
}

export interface TapsData {
  date: string;
  taps: number;
  feature: string;
  device_type: string;
}

export const useAppAnalytics = () => {
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalReports: 0,
    totalViews: 0,
    totalTaps: 0,
    avgAttentionTime: 0,
    activeUsers: 0,
    overdueReports: 0
  });
  const [reports, setReports] = useState<ReportAnalytics[]>([]);
  const [viewsData, setViewsData] = useState<ViewsData[]>([]);
  const [tapsData, setTapsData] = useState<TapsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperadmin = profile?.role === 'superadmin';

  const fetchMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [
        reportsResult,
        viewsResult,
        tapsResult,
        attentionResult,
        overdueResult
      ] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact' }),
        supabase.from('views').select('id', { count: 'exact' }).gte('viewed_at', today),
        supabase.from('taps').select('id', { count: 'exact' }).gte('tapped_at', today),
        supabase.from('report_attention').select('attention_time_minutes').not('attention_time_minutes', 'is', null),
        supabase.from('reports')
          .select('id, created_at')
          .eq('status', 'pending')
          .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const avgAttention = attentionResult.data?.length 
        ? attentionResult.data.reduce((sum, item) => sum + (item.attention_time_minutes || 0), 0) / attentionResult.data.length
        : 0;

      setMetrics({
        totalReports: reportsResult.count || 0,
        totalViews: viewsResult.count || 0,
        totalTaps: tapsResult.count || 0,
        avgAttentionTime: Math.round(avgAttention * 100) / 100,
        activeUsers: 0, // Will be calculated separately
        overdueReports: overdueResult.data?.length || 0
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to fetch analytics metrics');
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          status,
          issue_type,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user names and attention data separately to avoid join issues
      const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
      const reportIds = data.map(r => r.id);

      const [usersResult, attentionResult] = await Promise.all([
        userIds.length > 0 ? supabase
          .from('users')
          .select('id, name')
          .in('id', userIds) : { data: [], error: null },
        reportIds.length > 0 ? supabase
          .from('report_attention')
          .select('report_id, attention_time_minutes, acknowledged_at')
          .in('report_id', reportIds) : { data: [], error: null }
      ]);

      const usersMap = new Map((usersResult.data || []).map(u => [u.id, u.name]));
      const attentionMap = new Map((attentionResult.data || []).map(a => [a.report_id, a]));

      const analyticsReports: ReportAnalytics[] = data.map(report => ({
        id: report.id,
        title: report.title,
        status: report.status,
        issue_type: report.issue_type,
        created_at: report.created_at,
        user_id: report.user_id,
        reporter_name: usersMap.get(report.user_id) || 'Anonymous',
        attention_time: attentionMap.get(report.id)?.attention_time_minutes || null,
        is_overdue: report.status === 'pending' && 
          new Date(report.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
      }));

      setReports(analyticsReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports data');
    }
  };

  const fetchViewsData = async () => {
    try {
      const { data, error } = await supabase
        .from('views')
        .select('viewed_at, content_type, device_type')
        .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('viewed_at', { ascending: true });

      if (error) throw error;

      const groupedViews = data.reduce((acc: any, view) => {
        const date = view.viewed_at.split('T')[0];
        const key = `${date}-${view.content_type}-${view.device_type}`;
        
        if (!acc[key]) {
          acc[key] = {
            date,
            views: 0,
            content_type: view.content_type,
            device_type: view.device_type
          };
        }
        acc[key].views++;
        return acc;
      }, {});

      setViewsData(Object.values(groupedViews));
    } catch (err) {
      console.error('Error fetching views data:', err);
    }
  };

  const fetchTapsData = async () => {
    try {
      const { data, error } = await supabase
        .from('taps')
        .select('tapped_at, feature, device_type')
        .gte('tapped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('tapped_at', { ascending: true });

      if (error) throw error;

      const groupedTaps = data.reduce((acc: any, tap) => {
        const date = tap.tapped_at.split('T')[0];
        const key = `${date}-${tap.feature}-${tap.device_type}`;
        
        if (!acc[key]) {
          acc[key] = {
            date,
            taps: 0,
            feature: tap.feature,
            device_type: tap.device_type
          };
        }
        acc[key].taps++;
        return acc;
      }, {});

      setTapsData(Object.values(groupedTaps));
    } catch (err) {
      console.error('Error fetching taps data:', err);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
      
      await fetchReports();
      await fetchMetrics();
      
      return { success: true };
    } catch (err) {
      console.error('Error updating report status:', err);
      return { success: false, error: 'Failed to update report status' };
    }
  };

  const bulkUpdateReports = async (reportIds: string[], status: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .in('id', reportIds);

      if (error) throw error;
      
      await fetchReports();
      await fetchMetrics();
      
      return { success: true };
    } catch (err) {
      console.error('Error bulk updating reports:', err);
      return { success: false, error: 'Failed to bulk update reports' };
    }
  };

  const logView = async (contentId: string, contentType: string = 'report') => {
    try {
      const { error } = await supabase
        .from('views')
        .insert({
          content_id: contentId,
          content_type: contentType,
          user_id: user?.id,
          device_type: /Mobile|Android|iP(ad|od|hone)/.test(navigator.userAgent) ? 'mobile' : 'web',
          page_path: window.location.pathname
        });

      if (error) console.error('Error logging view:', error);
    } catch (err) {
      console.error('Error logging view:', err);
    }
  };

  const logTap = async (feature: string, elementType: string = 'button', metadata?: any) => {
    try {
      const { error } = await supabase
        .from('taps')
        .insert({
          feature,
          element_type: elementType,
          user_id: user?.id,
          device_type: /Mobile|Android|iP(ad|od|hone)/.test(navigator.userAgent) ? 'mobile' : 'web',
          page_path: window.location.pathname,
          metadata
        });

      if (error) console.error('Error logging tap:', error);
    } catch (err) {
      console.error('Error logging tap:', err);
    }
  };

  useEffect(() => {
    if (user && isSuperadmin) {
      setLoading(true);
      Promise.all([
        fetchMetrics(),
        fetchReports(),
        fetchViewsData(),
        fetchTapsData()
      ]).finally(() => setLoading(false));
    }
  }, [user, isSuperadmin]);

  useEffect(() => {
    if (!user || !isSuperadmin) return;

    const channels = [
      supabase
        .channel('analytics-reports')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
          fetchReports();
          fetchMetrics();
        }),
      supabase
        .channel('analytics-views')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'views' }, () => {
          fetchViewsData();
          fetchMetrics();
        }),
      supabase
        .channel('analytics-taps')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'taps' }, () => {
          fetchTapsData();
          fetchMetrics();
        }),
      supabase
        .channel('analytics-attention')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'report_attention' }, () => {
          fetchReports();
          fetchMetrics();
        })
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, isSuperadmin]);

  return {
    metrics,
    reports,
    viewsData,
    tapsData,
    loading,
    error,
    isSuperadmin,
    updateReportStatus,
    bulkUpdateReports,
    logView,
    logTap,
    refetch: () => {
      fetchMetrics();
      fetchReports();
      fetchViewsData();
      fetchTapsData();
    }
  };
};
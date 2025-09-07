import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format } from 'date-fns';

export interface RealTimeMetrics {
  totalUsers: number;
  dailyActiveUsers: number;
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  totalTaps: number;
  totalViews: number;
  avgResponseTime: number;
  overdueReports: number;
}

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

export const useRealTimeAnalytics = () => {
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    totalUsers: 0,
    dailyActiveUsers: 0,
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    totalTaps: 0,
    totalViews: 0,
    avgResponseTime: 0,
    overdueReports: 0
  });

  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
    label: 'Last 7 Days'
  });

  const [reportsData, setReportsData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperadmin = profile?.role === 'superadmin';

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const fromISO = dateRange.from.toISOString();
      const toISO = dateRange.to.toISOString();

      const [
        usersResult,
        reportsResult,
        resolvedReportsResult,
        pendingReportsResult,
        viewsResult,
        tapsResult,
        attentionResult,
        overdueResult,
        dailyActiveResult
      ] = await Promise.all([
        // Total users
        supabase.from('users').select('id', { count: 'exact' }),
        
        // Total reports in date range
        supabase.from('reports')
          .select('id', { count: 'exact' })
          .gte('created_at', fromISO)
          .lte('created_at', toISO),
        
        // Resolved reports in date range
        supabase.from('reports')
          .select('id', { count: 'exact' })
          .eq('status', 'resolved')
          .gte('created_at', fromISO)
          .lte('created_at', toISO),
        
        // Pending reports
        supabase.from('reports')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        
        // Views in date range
        supabase.from('views')
          .select('id', { count: 'exact' })
          .gte('viewed_at', fromISO)
          .lte('viewed_at', toISO),
        
        // Taps in date range
        supabase.from('taps')
          .select('id', { count: 'exact' })
          .gte('tapped_at', fromISO)
          .lte('tapped_at', toISO),
        
        // Average attention time
        supabase.from('report_attention')
          .select('attention_time_minutes')
          .not('attention_time_minutes', 'is', null),
        
        // Overdue reports (pending > 24h)
        supabase.from('reports')
          .select('id', { count: 'exact' })
          .eq('status', 'pending')
          .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        // Daily active users (last 24h)
        supabase.from('user_sessions')
          .select('user_id', { count: 'exact' })
          .gte('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .eq('is_active', true)
      ]);

      const avgAttention = attentionResult.data?.length 
        ? attentionResult.data.reduce((sum, item) => sum + (item.attention_time_minutes || 0), 0) / attentionResult.data.length
        : 0;

      setMetrics({
        totalUsers: usersResult.count || 0,
        dailyActiveUsers: dailyActiveResult.count || 0,
        totalReports: reportsResult.count || 0,
        resolvedReports: resolvedReportsResult.count || 0,
        pendingReports: pendingReportsResult.count || 0,
        totalTaps: tapsResult.count || 0,
        totalViews: viewsResult.count || 0,
        avgResponseTime: Math.round(avgAttention * 100) / 100,
        overdueReports: overdueResult.count || 0
      });

    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to fetch analytics data');
    }
  }, [dateRange]);

  const fetchTimeSeriesData = useCallback(async () => {
    try {
      const fromISO = dateRange.from.toISOString();
      const toISO = dateRange.to.toISOString();

      // Fetch reports timeline data
      const { data: reportsTimeline, error: reportsError } = await supabase
        .from('reports')
        .select('created_at')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: true });

      if (reportsError) throw reportsError;

      // Fetch user registration timeline
      const { data: usersTimeline, error: usersError } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: true });

      if (usersError) throw usersError;

      // Fetch engagement data (views and taps)
      const [viewsTimeline, tapsTimeline] = await Promise.all([
        supabase.from('views')
          .select('viewed_at')
          .gte('viewed_at', fromISO)
          .lte('viewed_at', toISO)
          .order('viewed_at', { ascending: true }),
        supabase.from('taps')
          .select('tapped_at')
          .gte('tapped_at', fromISO)
          .lte('tapped_at', toISO)
          .order('tapped_at', { ascending: true })
      ]);

      // Process reports data by day
      const reportsGrouped = reportsTimeline?.reduce((acc: any, report) => {
        const date = format(new Date(report.created_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      // Process users data by day
      const usersGrouped = usersTimeline?.reduce((acc: any, user) => {
        const date = format(new Date(user.created_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      // Process engagement data by day
      const viewsGrouped = viewsTimeline.data?.reduce((acc: any, view) => {
        const date = format(new Date(view.viewed_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      const tapsGrouped = tapsTimeline.data?.reduce((acc: any, tap) => {
        const date = format(new Date(tap.tapped_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      // Create date range array
      const days = [];
      const currentDate = new Date(dateRange.from);
      while (currentDate <= dateRange.to) {
        days.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Format data for charts
      setReportsData(days.map(date => ({
        date: format(new Date(date), 'MMM dd'),
        reports: reportsGrouped[date] || 0
      })));

      setUsersData(days.map(date => ({
        date: format(new Date(date), 'MMM dd'),
        newUsers: usersGrouped[date] || 0,
        activeUsers: Math.floor((usersGrouped[date] || 0) * 1.5) // Simulated active users
      })));

      setEngagementData(days.map(date => ({
        date: format(new Date(date), 'MMM dd'),
        views: viewsGrouped[date] || 0,
        taps: tapsGrouped[date] || 0,
        shares: Math.floor((tapsGrouped[date] || 0) * 0.3) // Simulated shares
      })));

    } catch (err) {
      console.error('Error fetching time series data:', err);
      setError('Failed to fetch chart data');
    }
  }, [dateRange]);

  const updateDateRange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMetrics(), fetchTimeSeriesData()]);
    setLoading(false);
  }, [fetchMetrics, fetchTimeSeriesData]);

  // Initial fetch
  useEffect(() => {
    if (user && isSuperadmin) {
      refetch();
    }
  }, [user, isSuperadmin, refetch]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user || !isSuperadmin) return;

    const channels = [
      supabase
        .channel('realtime-reports')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
          fetchMetrics();
          fetchTimeSeriesData();
        }),
      supabase
        .channel('realtime-users')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, () => {
          fetchMetrics();
          fetchTimeSeriesData();
        }),
      supabase
        .channel('realtime-views')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'views' }, () => {
          fetchMetrics();
          fetchTimeSeriesData();
        }),
      supabase
        .channel('realtime-taps')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'taps' }, () => {
          fetchMetrics();
          fetchTimeSeriesData();
        })
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, isSuperadmin, fetchMetrics, fetchTimeSeriesData]);

  return {
    metrics,
    reportsData,
    usersData,
    engagementData,
    dateRange,
    loading,
    error,
    isSuperadmin,
    updateDateRange,
    refetch
  };
};
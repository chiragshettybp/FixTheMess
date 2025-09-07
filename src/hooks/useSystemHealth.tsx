import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemMetric {
  id: string;
  metric_name: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface ErrorLog {
  id: string;
  error_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: 'frontend' | 'backend' | 'api' | 'database';
  message: string;
  status: 'open' | 'acknowledged' | 'resolved';
  resolved_by?: string;
  resolved_at?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface SystemHealthFilters {
  severity: string;
  component: string;
  status: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  search: string;
}

const DEFAULT_FILTERS: SystemHealthFilters = {
  severity: 'all',
  component: 'all',
  status: 'all',
  dateRange: { start: null, end: null },
  search: ''
};

export const useSystemHealth = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SystemHealthFilters>(DEFAULT_FILTERS);
  const { toast } = useToast();

  // Get latest metrics for each metric type
  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('system_health')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Get the latest value for each metric type
      const latestMetrics: Record<string, SystemMetric> = {};
      data?.forEach(metric => {
        if (!latestMetrics[metric.metric_name] || 
            new Date(metric.timestamp) > new Date(latestMetrics[metric.metric_name].timestamp)) {
          latestMetrics[metric.metric_name] = metric;
        }
      });

      setMetrics(Object.values(latestMetrics));
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system metrics",
        variant: "destructive",
      });
    }
  };

  // Fetch error logs with filters
  const fetchErrorLogs = async () => {
    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }
      if (filters.component !== 'all') {
        query = query.eq('component', filters.component);
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search.trim()) {
        query = query.or(`error_type.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
      }
      if (filters.dateRange.start) {
        query = query.gte('timestamp', filters.dateRange.start.toISOString());
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setErrorLogs((data || []) as ErrorLog[]);
    } catch (error) {
      console.error('Error fetching error logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch error logs",
        variant: "destructive",
      });
    }
  };

  // Update error status
  const updateErrorStatus = async (errorId: string, status: 'acknowledged' | 'resolved') => {
    try {
      const updates: any = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        // Note: resolved_by should be set to current user ID when auth is implemented
      }

      const { error } = await supabase
        .from('error_logs')
        .update(updates)
        .eq('id', errorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Error marked as ${status}`,
      });

      fetchErrorLogs(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update error status",
        variant: "destructive",
      });
    }
  };

  // Export error logs
  const exportErrorLogs = () => {
    const csvContent = [
      ['Timestamp', 'Error Type', 'Severity', 'Component', 'Message', 'Status'],
      ...errorLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.error_type,
        log.severity,
        log.component,
        log.message,
        log.status
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Update filters
  const updateFilters = (newFilters: Partial<SystemHealthFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Set up real-time subscriptions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchMetrics(), fetchErrorLogs()]);
      setLoading(false);
    };

    fetchData();

    // Subscribe to real-time updates
    const metricsChannel = supabase
      .channel('system-health-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_health' }, () => {
        fetchMetrics();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'error_logs' }, () => {
        fetchErrorLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchErrorLogs();
    }
  }, [filters]);

  return {
    metrics,
    errorLogs,
    loading,
    filters,
    updateFilters,
    clearFilters,
    updateErrorStatus,
    exportErrorLogs,
    refetch: () => Promise.all([fetchMetrics(), fetchErrorLogs()])
  };
};
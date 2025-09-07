import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FlagReport {
  id: string;
  report_id: string;
  flag_type: string;
  reason: string | null;
  flagged_by_user_id: string | null;
  status: string;
  is_auto_flagged: boolean;
  created_at: string;
  updated_at: string;
  reports?: {
    id: string;
    title: string;
    description: string;
    media_url: string;
    user_id: string;
    status: string;
    created_at: string;
  };
  flagged_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ModerationAction {
  id: string;
  action: string;
  actor_id: string;
  target_user_id: string | null;
  reason: string | null;
  payload: any;
  created_at: string;
}

export const useFlagReports = () => {
  const { user, profile } = useAuth();
  const [flagReports, setFlagReports] = useState<FlagReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is superadmin
  const isSuperadmin = profile?.role === 'superadmin';

  // Fetch all flag reports with related data
  const fetchFlagReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: flagReportsData, error: flagReportsError } = await supabase
        .from('report_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (flagReportsError) throw flagReportsError;

      // Fetch related reports and users data
      const enrichedReports = await Promise.all(
        (flagReportsData || []).map(async (flagReport) => {
          const [reportResult, userResult] = await Promise.all([
            supabase
              .from('reports')
              .select('id, title, description, media_url, user_id, status, created_at')
              .eq('id', flagReport.report_id)
              .single(),
            flagReport.flagged_by_user_id
              ? supabase
                  .from('users')
                  .select('id, name, email')
                  .eq('id', flagReport.flagged_by_user_id)
                  .single()
              : null
          ]);

          return {
            ...flagReport,
            reports: reportResult.data || null,
            flagged_by_user: userResult?.data || null
          };
        })
      );

      setFlagReports(enrichedReports);
    } catch (err) {
      console.error('Error fetching flag reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch flag reports');
    } finally {
      setLoading(false);
    }
  };

  // Resolve a flag report
  const resolveReport = async (flagId: string, notes: string) => {
    try {
      // Update flag status
      const { error: updateError } = await supabase
        .from('report_flags')
        .update({ 
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', flagId);

      if (updateError) throw updateError;

      // Log the action
      const { error: logError } = await supabase
        .from('actions_log')
        .insert({
          action: 'flag_report_resolved',
          actor_id: user?.id,
          reason: notes,
          payload: {
            flag_id: flagId,
            resolved_at: new Date().toISOString()
          }
        });

      if (logError) throw logError;

      // Refresh data
      await fetchFlagReports();
      return { success: true };
    } catch (err) {
      console.error('Error resolving report:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to resolve report' 
      };
    }
  };

  // Dismiss a flag report
  const dismissReport = async (flagId: string, notes: string) => {
    try {
      // Update flag status
      const { error: updateError } = await supabase
        .from('report_flags')
        .update({ 
          status: 'dismissed',
          updated_at: new Date().toISOString()
        })
        .eq('id', flagId);

      if (updateError) throw updateError;

      // Log the action
      const { error: logError } = await supabase
        .from('actions_log')
        .insert({
          action: 'flag_report_dismissed',
          actor_id: user?.id,
          reason: notes,
          payload: {
            flag_id: flagId,
            dismissed_at: new Date().toISOString()
          }
        });

      if (logError) throw logError;

      // Refresh data
      await fetchFlagReports();
      return { success: true };
    } catch (err) {
      console.error('Error dismissing report:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to dismiss report' 
      };
    }
  };

  // Ban user related to a report
  const banUser = async (userId: string, reason: string) => {
    try {
      // Update user role to banned
      const { error: userError } = await supabase
        .from('users')
        .update({ role: 'banned' })
        .eq('id', userId);

      if (userError) throw userError;

      // Log the ban action
      const { error: logError } = await supabase
        .from('actions_log')
        .insert({
          action: 'user_banned',
          actor_id: user?.id,
          target_user_id: userId,
          reason: reason,
          payload: {
            banned_at: new Date().toISOString(),
            ban_reason: reason
          }
        });

      if (logError) throw logError;

      return { success: true };
    } catch (err) {
      console.error('Error banning user:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to ban user' 
      };
    }
  };

  // Get moderation history for a flag report
  const getModerationHistory = async (flagId: string): Promise<ModerationAction[]> => {
    try {
      const { data, error } = await supabase
        .from('actions_log')
        .select('*')
        .or(`payload->>flag_id.eq.${flagId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching moderation history:', err);
      return [];
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !isSuperadmin) return;

    const channel = supabase
      .channel('flag-reports-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'report_flags' 
      }, () => {
        fetchFlagReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isSuperadmin]);

  // Initial data fetch
  useEffect(() => {
    if (user && isSuperadmin) {
      fetchFlagReports();
    }
  }, [user, isSuperadmin]);

  return {
    flagReports,
    loading,
    error,
    isSuperadmin,
    fetchFlagReports,
    resolveReport,
    dismissReport,
    banUser,
    getModerationHistory
  };
};
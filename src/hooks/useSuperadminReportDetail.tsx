import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ReportDetail {
  id: string;
  title: string;
  description: string | null;
  issue_type: string;
  status: string;
  severity?: string;
  latitude: number;
  longitude: number;
  media_url: string;
  user_id: string | null;
  is_anonymous: boolean;
  is_featured?: boolean;
  is_pinned?: boolean;
  nsfw?: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolved_image_url: string | null;
  region_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  metadata?: any;
  created_at: string;
}

export interface ReportFlag {
  id: string;
  flag_type: string;
  reason: string | null;
  status: string;
  flagged_by_user_id: string | null;
  created_at: string;
}

export interface Reporter {
  id: string;
  name: string;
  email: string;
  role: string;
  strike_count?: number;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  action: string;
  actor_name: string;
  details: string;
  created_at: string;
}

export const useSuperadminReportDetail = (reportId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [reportMedia, setReportMedia] = useState<ReportMedia[]>([]);
  const [flags, setFlags] = useState<ReportFlag[]>([]);
  const [reporter, setReporter] = useState<Reporter | null>(null);
  const [cityAdmins, setCityAdmins] = useState<any[]>([]);
  const [resolutionMedia, setResolutionMedia] = useState<ReportMedia[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch report details
  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data);

      // Fetch reporter if not anonymous
      if (data.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user_id)
          .single();

        if (!userError && userData) {
          setReporter(userData);
        }
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to fetch report details');
    }
  };

  // Fetch report flags
  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('report_flags')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (err) {
      console.error('Error fetching flags:', err);
    }
  };

  // Fetch city admins
  const fetchCityAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('city_admins')
        .select('*')
        .eq('status', 'active')
        .order('admin_name');

      if (error) throw error;
      setCityAdmins(data || []);
    } catch (err) {
      console.error('Error fetching city admins:', err);
    }
  };

  // Create mock data for missing features
  useEffect(() => {
    if (report) {
      // Mock media gallery
      setReportMedia([
        {
          id: '1',
          url: report.media_url,
          type: 'image',
          created_at: report.created_at
        }
      ]);

      // Mock resolution media
      if (report.resolved_image_url) {
        setResolutionMedia([
          {
            id: '2',
            url: report.resolved_image_url,
            type: 'image',
            created_at: report.resolved_at || report.updated_at
          }
        ]);
      }

      // Mock timeline
      const timelineEvents: TimelineEvent[] = [
        {
          id: '1',
          action: 'created',
          actor_name: reporter?.name || 'Anonymous User',
          details: 'Report created',
          created_at: report.created_at
        }
      ];

      if (report.status !== 'pending') {
        timelineEvents.push({
          id: '2',
          action: report.status,
          actor_name: 'System',
          details: `Report marked as ${report.status}`,
          created_at: report.updated_at
        });
      }

      if (report.resolved_at) {
        timelineEvents.push({
          id: '3',
          action: 'resolved',
          actor_name: 'Government Official',
          details: 'Report resolved with proof',
          created_at: report.resolved_at
        });
      }

      setTimeline(timelineEvents);
    }
  }, [report, reporter]);

  // Initial data fetch
  useEffect(() => {
    if (reportId && user) {
      setLoading(true);
      Promise.all([
        fetchReport(),
        fetchFlags(),
        fetchCityAdmins()
      ]).finally(() => setLoading(false));
    }
  }, [reportId, user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!reportId || !user) return;

    const channels = [
      supabase
        .channel(`report-${reportId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `id=eq.${reportId}` }, () => {
          fetchReport();
        }),
      supabase
        .channel(`flags-${reportId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'report_flags', filter: `report_id=eq.${reportId}` }, () => {
          fetchFlags();
        })
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [reportId, user]);

  // Action handlers
  const approveReport = async () => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'approved' })
        .eq('id', reportId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Report approved successfully' });
      fetchReport();
    } catch (err) {
      console.error('Error approving report:', err);
      toast({ title: 'Error', description: 'Failed to approve report', variant: 'destructive' });
    }
  };

  const rejectReport = async () => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'rejected' })
        .eq('id', reportId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Report rejected successfully' });
      fetchReport();
    } catch (err) {
      console.error('Error rejecting report:', err);
      toast({ title: 'Error', description: 'Failed to reject report', variant: 'destructive' });
    }
  };

  const hideReport = async () => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'hidden' })
        .eq('id', reportId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Report hidden successfully' });
      fetchReport();
    } catch (err) {
      console.error('Error hiding report:', err);
      toast({ title: 'Error', description: 'Failed to hide report', variant: 'destructive' });
    }
  };

  const unhideReport = async () => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'approved' })
        .eq('id', reportId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Report unhidden successfully' });
      fetchReport();
    } catch (err) {
      console.error('Error unhiding report:', err);
      toast({ title: 'Error', description: 'Failed to unhide report', variant: 'destructive' });
    }
  };

  // Mock feature/pin/NSFW functions (would need additional DB columns)
  const featureReport = async () => {
    toast({ title: 'Info', description: 'Feature functionality coming soon' });
  };

  const unfeatureReport = async () => {
    toast({ title: 'Info', description: 'Unfeature functionality coming soon' });
  };

  const pinReport = async () => {
    toast({ title: 'Info', description: 'Pin functionality coming soon' });
  };

  const unpinReport = async () => {
    toast({ title: 'Info', description: 'Unpin functionality coming soon' });
  };

  const markNSFW = async () => {
    toast({ title: 'Info', description: 'NSFW marking functionality coming soon' });
  };

  const unmarkNSFW = async () => {
    toast({ title: 'Info', description: 'NSFW unmarking functionality coming soon' });
  };

  const assignToCityAdmin = async (adminId: string) => {
    toast({ title: 'Info', description: 'Assignment functionality coming soon' });
  };

  const markResolved = async () => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id
        })
        .eq('id', reportId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Report marked as resolved' });
      fetchReport();
    } catch (err) {
      console.error('Error resolving report:', err);
      toast({ title: 'Error', description: 'Failed to resolve report', variant: 'destructive' });
    }
  };

  const resolveFlag = async (flagId: string) => {
    try {
      const { error } = await supabase
        .from('report_flags')
        .update({ status: 'resolved' })
        .eq('id', flagId);

      if (error) throw error;
      toast({ title: 'Success', description: 'Flag resolved successfully' });
      fetchFlags();
    } catch (err) {
      console.error('Error resolving flag:', err);
      toast({ title: 'Error', description: 'Failed to resolve flag', variant: 'destructive' });
    }
  };

  const addAdminNote = async (note: string) => {
    toast({ title: 'Info', description: 'Admin notes functionality coming soon' });
  };

  const warnUser = async (userId: string) => {
    toast({ title: 'Info', description: 'User warning functionality coming soon' });
  };

  const addStrike = async (userId: string) => {
    toast({ title: 'Info', description: 'Strike system functionality coming soon' });
  };

  const banUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'banned' })
        .eq('id', userId);

      if (error) throw error;
      toast({ title: 'Success', description: 'User banned successfully' });
      fetchReport();
    } catch (err) {
      console.error('Error banning user:', err);
      toast({ title: 'Error', description: 'Failed to ban user', variant: 'destructive' });
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'user' })
        .eq('id', userId);

      if (error) throw error;
      toast({ title: 'Success', description: 'User unbanned successfully' });
      fetchReport();
    } catch (err) {
      console.error('Error unbanning user:', err);
      toast({ title: 'Error', description: 'Failed to unban user', variant: 'destructive' });
    }
  };

  return {
    report,
    reportMedia,
    flags,
    reporter,
    cityAdmins,
    resolutionMedia,
    timeline,
    loading,
    error,
    approveReport,
    rejectReport,
    hideReport,
    unhideReport,
    featureReport,
    unfeatureReport,
    pinReport,
    unpinReport,
    markNSFW,
    unmarkNSFW,
    assignToCityAdmin,
    markResolved,
    resolveFlag,
    addAdminNote,
    warnUser,
    addStrike,
    banUser,
    unbanUser
  };
};
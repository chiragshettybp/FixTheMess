import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Report {
  id: string;
  title: string;
  description: string | null;
  issue_type: string;
  status: string;
  media_url: string;
  resolved_image_url: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  latitude: number;
  longitude: number;
  user_id: string | null;
  is_anonymous: boolean;
  region_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GovernmentUser {
  id: string;
  user_id: string;
  full_name: string;
  designation: string;
  region_id: string | null;
}

export const useGovernmentReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [governmentUser, setGovernmentUser] = useState<GovernmentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch government user profile
  const fetchGovernmentUser = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('government_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching government user:', error);
        setError('Failed to fetch government profile');
        return;
      }

      setGovernmentUser(data);
    } catch (err) {
      console.error('Error fetching government user:', err);
      setError('Failed to fetch government profile');
    }
  };

  // Fetch reports for the government user's region
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      if (!governmentUser) {
        console.log('Government user not found');
        setReports([]);
        setError('Government user profile not found. Please contact your administrator.');
        return;
      }

      // Filter by region if government user has a region assigned
      const query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (governmentUser.region_id) {
        query.eq('region_id', governmentUser.region_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to fetch reports');
        return;
      }

      setReports(data || []);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // Mark report as resolved
  const markAsResolved = async (reportId: string, resolvedImageUrl: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      console.log('Marking report as resolved:', { reportId, resolvedImageUrl, userId: user.id });
      
      const { data, error } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          resolved_image_url: resolvedImageUrl,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select();

      if (error) {
        console.error('Error marking report as resolved:', error);
        return { error: 'Failed to mark report as resolved: ' + error.message };
      }

      console.log('Report updated successfully:', data);
      
      // Force immediate refresh
      setTimeout(() => {
        fetchReports();
      }, 100);
      
      return { error: null };
    } catch (err) {
      console.error('Error marking report as resolved:', err);
      return { error: 'Failed to mark report as resolved' };
    }
  };

  // Filter reports by status
  const getFilteredReports = (status: string) => {
    const statusMap: { [key: string]: string[] } = {
      new: ['pending'],
      urgent: ['urgent'],
      resolved: ['resolved']
    };

    return reports.filter(report => 
      statusMap[status]?.includes(report.status) || 
      (status === 'new' && report.status === 'pending')
    );
  };

  useEffect(() => {
    if (user) {
      fetchGovernmentUser();
    }
  }, [user]);

  useEffect(() => {
    if (governmentUser) {
      fetchReports();
    }
  }, [governmentUser]);

  // Set up real-time subscription for reports
  useEffect(() => {
    if (!governmentUser) return;

    const channel = supabase
      .channel('government-reports-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Immediately refetch reports when any change happens
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [governmentUser]);

  return {
    reports,
    governmentUser,
    loading,
    error,
    markAsResolved,
    getFilteredReports,
    refetch: fetchReports
  };
};
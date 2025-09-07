import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface GovernmentUser {
  id: string;
  user_id: string;
  full_name: string;
  designation: string;
  region_id: string | null;
  government_id_url: string | null;
  created_at: string;
  updated_at: string;
  users: {
    email: string;
    role: string;
  };
  regions?: {
    name: string;
    state: string;
  };
}

export interface GovernmentUserWithStats extends GovernmentUser {
  total_reports_handled: number;
  pending_reports: number;
  resolved_reports: number;
  recent_reports: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
}

export interface BanGovernmentUserParams {
  userId: string;
  reason: string;
}

export const useGovernmentUserManagement = () => {
  const { user, profile } = useAuth();
  const [governmentUsers, setGovernmentUsers] = useState<GovernmentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is superadmin
  const isSuperadmin = profile?.role === 'superadmin';

  // Fetch all government users
  const fetchGovernmentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('government_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user details separately
      const usersWithDetails = await Promise.all(
        (data || []).map(async (govUser) => {
          const [userResult, regionResult] = await Promise.all([
            supabase.from('users').select('email, role').eq('id', govUser.user_id).single(),
            govUser.region_id ? supabase.from('regions').select('name, state').eq('id', govUser.region_id).single() : null
          ]);
          
          return {
            ...govUser,
            users: userResult.data || { email: '', role: 'government' },
            regions: regionResult?.data || null
          };
        })
      );

      setGovernmentUsers(usersWithDetails);
    } catch (err) {
      console.error('Error fetching government users:', err);
      setError('Failed to fetch government users');
    }
  };

  // Fetch single government user with detailed stats
  const fetchGovernmentUserDetails = async (userId: string): Promise<GovernmentUserWithStats | null> => {
    try {
      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('government_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userError) throw userError;

      // Fetch related data separately
      const [userResult, regionResult] = await Promise.all([
        supabase.from('users').select('email, role').eq('id', userId).single(),
        userData.region_id ? supabase.from('regions').select('name, state').eq('id', userData.region_id).single() : null
      ]);

      const userWithRelations = {
        ...userData,
        users: userResult.data || { email: '', role: 'government' },
        regions: regionResult?.data || null
      };

      // Get report statistics
      const [totalReportsResult, pendingReportsResult, resolvedReportsResult, recentReportsResult] = await Promise.all([
        supabase
          .from('reports')
          .select('id', { count: 'exact' })
          .eq('resolved_by', userId),
        supabase
          .from('reports')
          .select('id', { count: 'exact' })
          .eq('resolved_by', userId)
          .eq('status', 'pending'),
        supabase
          .from('reports')
          .select('id', { count: 'exact' })
          .eq('resolved_by', userId)
          .eq('status', 'resolved'),
        supabase
          .from('reports')
          .select('id, title, status, created_at')
          .eq('resolved_by', userId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      return {
        ...userWithRelations,
        total_reports_handled: totalReportsResult.count || 0,
        pending_reports: pendingReportsResult.count || 0,
        resolved_reports: resolvedReportsResult.count || 0,
        recent_reports: recentReportsResult.data || []
      };
    } catch (err) {
      console.error('Error fetching government user details:', err);
      throw new Error('Failed to fetch government user details');
    }
  };

  // Update government user
  const updateGovernmentUser = async (userId: string, updates: Partial<GovernmentUser>) => {
    try {
      const { error } = await supabase
        .from('government_users')
        .update({
          full_name: updates.full_name,
          designation: updates.designation,
          region_id: updates.region_id,
          government_id_url: updates.government_id_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // If email update is needed, update the users table
      if (updates.users?.email) {
        const { error: userError } = await supabase
          .from('users')
          .update({ email: updates.users.email })
          .eq('id', userId);

        if (userError) throw userError;
      }

      // Refresh the list
      await fetchGovernmentUsers();
      return { error: null };
    } catch (err) {
      console.error('Error updating government user:', err);
      return { error: 'Failed to update government user' };
    }
  };

  // Ban government user
  const banGovernmentUser = async ({ userId, reason }: BanGovernmentUserParams) => {
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
          action: 'government_user_banned',
          actor_id: user?.id,
          target_user_id: userId,
          reason: reason,
          payload: {
            ban_reason: reason,
            banned_at: new Date().toISOString()
          }
        });

      if (logError) throw logError;

      // Refresh the list
      await fetchGovernmentUsers();
      return { error: null };
    } catch (err) {
      console.error('Error banning government user:', err);
      return { error: 'Failed to ban government user' };
    }
  };

  // Unban government user
  const unbanGovernmentUser = async (userId: string, reason: string) => {
    try {
      // Update user role back to government
      const { error: userError } = await supabase
        .from('users')
        .update({ role: 'government' })
        .eq('id', userId);

      if (userError) throw userError;

      // Log the unban action
      const { error: logError } = await supabase
        .from('actions_log')
        .insert({
          action: 'government_user_unbanned',
          actor_id: user?.id,
          target_user_id: userId,
          reason: reason,
          payload: {
            unban_reason: reason,
            unbanned_at: new Date().toISOString()
          }
        });

      if (logError) throw logError;

      // Refresh the list
      await fetchGovernmentUsers();
      return { error: null };
    } catch (err) {
      console.error('Error unbanning government user:', err);
      return { error: 'Failed to unban government user' };
    }
  };

  // Get government users with report counts
  const getGovernmentUsersWithStats = async () => {
    try {
      const users = await Promise.all(
        governmentUsers.map(async (user) => {
          const { count } = await supabase
            .from('reports')
            .select('id', { count: 'exact' })
            .eq('resolved_by', user.user_id);
          
          return {
            ...user,
            total_reports_handled: count || 0
          };
        })
      );
      return users;
    } catch (err) {
      console.error('Error getting users with stats:', err);
      return governmentUsers.map(user => ({ ...user, total_reports_handled: 0 }));
    }
  };

  // Fetch regions for dropdowns
  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, state')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching regions:', err);
      return [];
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user && isSuperadmin) {
      setLoading(true);
      fetchGovernmentUsers().finally(() => setLoading(false));
    }
  }, [user, isSuperadmin]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !isSuperadmin) return;

    const channels = [
      supabase
        .channel('government-users-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'government_users' }, () => {
          fetchGovernmentUsers();
        }),
      supabase
        .channel('users-role-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, () => {
          fetchGovernmentUsers();
        })
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, isSuperadmin]);

  return {
    governmentUsers,
    loading,
    error,
    isSuperadmin,
    fetchGovernmentUsers,
    fetchGovernmentUserDetails,
    updateGovernmentUser,
    banGovernmentUser,
    unbanGovernmentUser,
    getGovernmentUsersWithStats,
    fetchRegions
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'user' | 'admin' | 'superadmin' | 'government' | 'banned';
type UserStatusType = 'active' | 'suspended' | 'banned' | 'deleted';

interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface UserStatus {
  id: string;
  user_id: string;
  status: UserStatusType;
  strike_count: number;
  suspension_until: string | null;
  reasons: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Report {
  id: string;
  title: string;
  status: string;
  created_at: string;
  vote_count?: number;
  flag_count?: number;
}

interface Flag {
  id: string;
  flag_type: string;
  reason: string | null;
  status: string;
  created_at: string;
  report?: {
    id: string;
    title: string;
  } | null;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  delivery_status: string;
  created_at: string;
  sent_by: string | null;
}

interface ActionLog {
  id: string;
  actor_id: string;
  action: string;
  reason: string | null;
  payload: any;
  created_at: string;
  actor?: {
    name: string;
    email: string;
  };
}

interface UserSession {
  id: string;
  device_id: string | null;
  last_seen_at: string;
  ip_hash: string | null;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
}

export const useSuperadminUserDetail = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch all user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Fetch user status
      const { data: statusData, error: statusError } = await supabase
        .from('user_status')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (statusError) throw statusError;
      setUserStatus(statusData as UserStatus | null);

      // Fetch user reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('id, title, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);

      // Fetch flags against user's content
      const { data: flagsData, error: flagsError } = await supabase
        .from('report_flags')
        .select(`
          id,
          flag_type,
          reason,
          status,
          created_at,
          report_id
        `)
        .in('report_id', (reportsData || []).map(r => r.id));

      if (flagsError) throw flagsError;
      
      // Transform flags data to match interface
      const transformedFlags: Flag[] = (flagsData || []).map(flag => ({
        ...flag,
        report: null // We'll handle this differently if needed
      }));
      setFlags(transformedFlags);

      // Fetch notifications sent to user
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);

      // Fetch action logs for this user
      const { data: logsData, error: logsError } = await supabase
        .from('actions_log')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;
      
      // Transform logs data to match interface
      const transformedLogs: ActionLog[] = (logsData || []).map(log => ({
        ...log,
        actor: undefined // We'll handle this differently if needed
      }));
      setActionLogs(transformedLogs);

      // Fetch user sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  // Log admin action
  const logAction = async (action: string, reason?: string, payload?: any) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      await supabase.from('actions_log').insert({
        actor_id: currentUser.id,
        target_user_id: userId,
        action,
        reason: reason || null,
        payload: payload || null
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      await logAction('update_profile', 'Profile updated', updates);
      await fetchUserData();
      
      toast({
        title: "Success",
        description: "User profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update user profile",
        variant: "destructive",
      });
    }
  };

  // Change user role
  const changeRole = async (newRole: UserRole, reason: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await logAction('change_role', reason, { old_role: user?.role, new_role: newRole });
      await fetchUserData();
      
      toast({
        title: "Success",
        description: "User role changed successfully",
      });
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: "Error",
        description: "Failed to change user role",
        variant: "destructive",
      });
    }
  };

  // Warn user
  const warnUser = async (reason: string) => {
    try {
      // Create notification
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Warning from Admin',
        body: `You have received a warning: ${reason}`,
        sent_by: (await supabase.auth.getUser()).data.user?.id
      });

      await logAction('warn_user', reason);
      await fetchUserData();
      
      toast({
        title: "Success",
        description: "Warning sent to user",
      });
    } catch (error) {
      console.error('Error warning user:', error);
      toast({
        title: "Error",
        description: "Failed to warn user",
        variant: "destructive",
      });
    }
  };

  // Add strike
  const addStrike = async (reason: string) => {
    try {
      const newStrikeCount = (userStatus?.strike_count || 0) + 1;
      const updates: any = { 
        strike_count: newStrikeCount,
        reasons: [...(userStatus?.reasons || []), reason]
      };

      // Auto-suspend if strikes reach threshold (3)
      if (newStrikeCount >= 3) {
        updates.status = 'suspended';
        updates.suspension_until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      }

      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          ...updates
        });

      if (error) throw error;

      await logAction('add_strike', reason, { strike_count: newStrikeCount });
      await fetchUserData();
      
      toast({
        title: "Success",
        description: `Strike added. User now has ${newStrikeCount} strikes.`,
      });
    } catch (error) {
      console.error('Error adding strike:', error);
      toast({
        title: "Error",
        description: "Failed to add strike",
        variant: "destructive",
      });
    }
  };

  // Suspend/Unsuspend user
  const suspendUser = async (reason: string, duration?: number) => {
    try {
      const suspensionUntil = duration 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          status: 'suspended',
          suspension_until: suspensionUntil,
          reasons: [...(userStatus?.reasons || []), reason]
        });

      if (error) throw error;

      await logAction('suspend_user', reason, { duration, suspension_until: suspensionUntil });
      await fetchUserData();
      
      toast({
        title: "Success",
        description: "User suspended successfully",
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    }
  };

  const unsuspendUser = async (reason: string) => {
    try {
      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          status: 'active',
          suspension_until: null,
          reasons: [...(userStatus?.reasons || []), `Unsuspended: ${reason}`]
        });

      if (error) throw error;

      await logAction('unsuspend_user', reason);
      await fetchUserData();
      
      toast({
        title: "Success",
        description: "User unsuspended successfully",
      });
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast({
        title: "Error",
        description: "Failed to unsuspend user",
        variant: "destructive",
      });
    }
  };

  // Ban/Unban user
  const banUser = async (reason: string) => {
    try {
      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          status: 'banned',
          suspension_until: null,
          reasons: [...(userStatus?.reasons || []), reason]
        });

      if (error) throw error;

      await logAction('ban_user', reason);
      await fetchUserData();
      
      toast({
        title: "Success",
        description: "User banned successfully",
      });
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const unbanUser = async (reason: string) => {
    try {
      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          status: 'active',
          suspension_until: null,
          reasons: [...(userStatus?.reasons || []), `Unbanned: ${reason}`]
        });

      if (error) throw error;

      await logAction('unban_user', reason);
      await fetchUserData();
      
      toast({
        title: "Success",
        description: "User unbanned successfully",
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    }
  };

  // Send notification
  const sendNotification = async (title: string, body: string) => {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        title,
        body,
        sent_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      await logAction('send_notification', `Sent: ${title}`, { title, body });
      await fetchUserData();
      
      toast({
        title: "Success",
        description: "Notification sent successfully",
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  // Revoke user sessions
  const revokeAllSessions = async (reason: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;

      await logAction('revoke_sessions', reason);
      await fetchUserData();
      
      toast({
        title: "Success",
        description: "All user sessions revoked",
      });
    } catch (error) {
      console.error('Error revoking sessions:', error);
      toast({
        title: "Error",
        description: "Failed to revoke user sessions",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    fetchUserData();

    // Subscribe to user updates
    const userChannel = supabase
      .channel(`user_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, () => {
        fetchUserData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_status',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchUserData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'actions_log',
        filter: `target_user_id=eq.${userId}`
      }, () => {
        fetchUserData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [userId]);

  return {
    user,
    userStatus,
    reports,
    flags,
    notifications,
    actionLogs,
    sessions,
    loading,
    error,
    updateProfile,
    changeRole,
    warnUser,
    addStrike,
    suspendUser,
    unsuspendUser,
    banUser,
    unbanUser,
    sendNotification,
    revokeAllSessions,
    refreshData: fetchUserData
  };
};
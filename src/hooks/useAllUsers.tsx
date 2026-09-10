import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface UserWithStats {
  id: string;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  is_anonymous: boolean;
  report_count: number;
  status: string;
  strike_count: number;
  suspension_until: string | null;
  last_seen_at: string | null;
}

export const useAllUsers = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { profile } = useAuth();

  const ITEMS_PER_PAGE = 25;

  const fetchUsers = async () => {
    if (!profile || (profile.role !== 'superadmin' && profile.role !== 'admin')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      // Step 1: Get basic users data
      const { data: usersData, error: usersError, count } = await supabase
        .from('users')
        .select('id, name, email, username, phone, role, created_at, is_anonymous', { count: 'exact' })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      if (!usersData || usersData.length === 0) {
        setUsers([]);
        setTotalCount(count || 0);
        return;
      }

      const userIds = usersData.map(u => u.id);

      // Step 2: Get user status data
      const { data: statusData } = await supabase
        .from('user_status')
        .select('user_id, status, strike_count, suspension_until')
        .in('user_id', userIds);

      // Step 3: Get user sessions data  
      const { data: sessionsData } = await supabase
        .from('user_sessions')
        .select('user_id, last_seen_at')
        .in('user_id', userIds)
        .order('last_seen_at', { ascending: false });

      // Step 4: Get report counts
      const { data: reportData } = await supabase
        .from('reports')
        .select('user_id')
        .in('user_id', userIds);

      // Create lookup maps
      const statusMap = new Map(statusData?.map(s => [s.user_id, s]) || []);
      const sessionMap = new Map();
      const reportCounts = new Map();

      // Process sessions (get latest for each user)
      sessionsData?.forEach(session => {
        if (!sessionMap.has(session.user_id)) {
          sessionMap.set(session.user_id, session);
        }
      });

      // Process report counts
      reportData?.forEach(report => {
        const count = reportCounts.get(report.user_id) || 0;
        reportCounts.set(report.user_id, count + 1);
      });

      // Step 5: Combine all data
      const usersWithStats: UserWithStats[] = usersData.map(user => {
        const status = statusMap.get(user.id);
        const session = sessionMap.get(user.id);
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          phone: user.phone,
          role: user.role,
          created_at: user.created_at,
          is_anonymous: user.is_anonymous,
          report_count: reportCounts.get(user.id) || 0,
          status: status?.status || 'active',
          strike_count: status?.strike_count || 0,
          suspension_until: status?.suspension_until || null,
          last_seen_at: session?.last_seen_at || null
        };
      });

      setUsers(usersWithStats);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_status' }, () => {
        fetchUsers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchUsers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage]);

  return {
    users,
    loading,
    currentPage,
    totalCount,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    itemsPerPage: ITEMS_PER_PAGE,
    setCurrentPage,
    refetch: fetchUsers
  };
};
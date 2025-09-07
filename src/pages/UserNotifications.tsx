import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { NotificationList } from '@/components/notifications/NotificationList';
import { NotificationFilters } from '@/components/notifications/NotificationFilters';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
export interface Notification {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  is_read: boolean;
  created_at: string;
  sent_by: string | null;
  delivery_status: string;
}
export interface NotificationFilters {
  status: 'all' | 'read' | 'unread';
  priority: 'all' | 'high' | 'medium' | 'low';
  search: string;
}
const UserNotifications = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NotificationFilters>({
    status: 'all',
    priority: 'all',
    search: ''
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 25;
  const fetchNotifications = async (currentPage = 0, currentFilters = filters) => {
    if (!user) return;
    try {
      let query = supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      // Apply status filter
      if (currentFilters.status === 'read') {
        query = query.eq('is_read', true);
      } else if (currentFilters.status === 'unread') {
        query = query.eq('is_read', false);
      }

      // Apply priority filter
      if (currentFilters.priority !== 'all') {
        query = query.eq('priority', currentFilters.priority);
      }

      // Apply search filter
      if (currentFilters.search) {
        query = query.or(`title.ilike.%${currentFilters.search}%,body.ilike.%${currentFilters.search}%`);
      }
      const {
        data,
        error
      } = await query;
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch notifications',
          variant: 'destructive'
        });
        return;
      }
      if (currentPage === 0) {
        setNotifications((data || []) as Notification[]);
      } else {
        setNotifications(prev => [...prev, ...((data || []) as Notification[])]);
      }
      setHasMore((data || []).length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const updateReadStatus = async (notificationId: string, isRead: boolean) => {
    try {
      const {
        error
      } = await supabase.from('notifications').update({
        is_read: isRead
      }).eq('id', notificationId);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update notification status',
          variant: 'destructive'
        });
        return;
      }

      // Update local state
      setNotifications(prev => prev.map(notification => notification.id === notificationId ? {
        ...notification,
        is_read: isRead
      } : notification));
      toast({
        title: 'Success',
        description: `Notification marked as ${isRead ? 'read' : 'unread'}`
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification status',
        variant: 'destructive'
      });
    }
  };
  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const {
        error
      } = await supabase.from('notifications').update({
        is_read: true
      }).eq('user_id', user.id).eq('is_read', false);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to mark all notifications as read',
          variant: 'destructive'
        });
        return;
      }

      // Update local state
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true
      })));
      toast({
        title: 'Success',
        description: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  const handleFiltersChange = (newFilters: NotificationFilters) => {
    setFilters(newFilters);
    setPage(0);
    setLoading(true);
    fetchNotifications(0, newFilters);
  };
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };
  useEffect(() => {
    fetchNotifications();
  }, [user]);
  useEffect(() => {
    if (!user) return;

    // Set up real-time subscription
    const channel = supabase.channel('user-notifications').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, payload => {
      console.log('Real-time notification update:', payload);
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        toast({
          title: 'New Notification',
          description: (payload.new as Notification).title
        });
      } else if (payload.eventType === 'UPDATE') {
        setNotifications(prev => prev.map(notification => notification.id === payload.new.id ? payload.new as Notification : notification));
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
  if (loading && notifications.length === 0) {
    return <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>;
  }
  return <div className="container mx-auto px-4 py-8 max-w-6xl">
      

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <NotificationFilters filters={filters} onFiltersChange={handleFiltersChange} onMarkAllAsRead={markAllAsRead} unreadCount={notifications.filter(n => !n.is_read).length} />
        </div>
        
        <div className="lg:col-span-3">
          <NotificationList notifications={notifications} onUpdateReadStatus={updateReadStatus} onLoadMore={loadMore} hasMore={hasMore} loading={loading} />
        </div>
      </div>
    </div>;
};
export default UserNotifications;
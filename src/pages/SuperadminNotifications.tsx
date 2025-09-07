import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { NotificationComposer } from '@/components/superadmin/NotificationComposer';
import { NotificationTable } from '@/components/superadmin/NotificationTable';
import { NotificationFiltersPanel } from '@/components/superadmin/NotificationFiltersPanel';
import { Send, Bell, Users, UserCheck, Shield } from 'lucide-react';

export interface SuperadminNotification {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  recipient_role: string | null;
  user_id: string;
  sent_by: string | null;
  delivery_status: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  status: 'all' | 'sent' | 'pending' | 'failed';
  recipient_type: 'all' | 'user' | 'government' | 'admin' | 'superadmin';
  priority: 'all' | 'high' | 'medium' | 'low';
  search: string;
  date_from: string;
  date_to: string;
}

const SuperadminNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<SuperadminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({
    status: 'all',
    recipient_type: 'all',
    priority: 'all',
    search: '',
    date_from: '',
    date_to: ''
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 25;

  const fetchNotifications = async (currentPage = 0, currentFilters = filters) => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      // Apply filters
      if (currentFilters.status !== 'all') {
        query = query.eq('delivery_status', currentFilters.status);
      }

      if (currentFilters.recipient_type !== 'all') {
        query = query.eq('recipient_role', currentFilters.recipient_type);
      }

      if (currentFilters.priority !== 'all') {
        query = query.eq('priority', currentFilters.priority);
      }

      if (currentFilters.search) {
        query = query.or(`title.ilike.%${currentFilters.search}%,body.ilike.%${currentFilters.search}%`);
      }

      if (currentFilters.date_from) {
        query = query.gte('created_at', currentFilters.date_from);
      }

      if (currentFilters.date_to) {
        query = query.lte('created_at', currentFilters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch notifications',
          variant: 'destructive'
        });
        return;
      }

      if (currentPage === 0) {
        setNotifications((data || []) as SuperadminNotification[]);
      } else {
        setNotifications(prev => [...prev, ...((data || []) as SuperadminNotification[])]);
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

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: 'Success',
        description: 'Notification deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
    }
  };

  const resendNotification = async (notification: SuperadminNotification) => {
    try {
      setSending(true);
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          delivery_status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id
            ? { ...n, delivery_status: 'sent', updated_at: new Date().toISOString() }
            : n
        )
      );

      toast({
        title: 'Success',
        description: 'Notification resent successfully',
      });
    } catch (error) {
      console.error('Error resending notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend notification',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('superadmin-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Real-time notification update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as SuperadminNotification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(notification =>
                notification.id === payload.new.id
                  ? payload.new as SuperadminNotification
                  : notification
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev =>
              prev.filter(notification => notification.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notification Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Send, track, and manage notifications to all users across the platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Compose & Filters */}
          <div className="lg:col-span-1 space-y-6">
            <NotificationComposer 
              onNotificationSent={(notification) => {
                setNotifications(prev => [notification, ...prev]);
                toast({
                  title: 'Success',
                  description: 'Notification sent successfully',
                });
              }}
            />
            
            <NotificationFiltersPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              notificationCount={notifications.length}
            />
          </div>

          {/* Right Panel - Notifications Table */}
          <div className="lg:col-span-2">
            <NotificationTable
              notifications={notifications}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onDelete={deleteNotification}
              onResend={resendNotification}
              sending={sending}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminNotifications;
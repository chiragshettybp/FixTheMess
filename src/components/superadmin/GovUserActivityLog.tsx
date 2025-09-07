import { useState, useEffect } from 'react';
import { Clock, User, Activity, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  action: string;
  actor_id: string;
  target_user_id: string;
  reason: string | null;
  payload: any;
  created_at: string;
}

interface GovUserActivityLogProps {
  userId: string;
  className?: string;
}

export const GovUserActivityLog = ({ userId, className }: GovUserActivityLogProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivityLogs();
    
    // Set up real-time subscription for activity logs
    const channel = supabase
      .channel(`activity-logs-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'actions_log',
        filter: `target_user_id=eq.${userId}`
      }, () => {
        fetchActivityLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchActivityLogs = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('actions_log')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load activity logs');
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionConfig = {
      'government_user_banned': { variant: 'destructive' as const, label: 'Banned' },
      'government_user_unbanned': { variant: 'default' as const, label: 'Unbanned' },
      'government_user_updated': { variant: 'secondary' as const, label: 'Updated' },
      'government_user_created': { variant: 'default' as const, label: 'Created' },
    };

    const config = actionConfig[action as keyof typeof actionConfig] || 
                  { variant: 'outline' as const, label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchActivityLogs} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActionBadge(activity.action)}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                  </div>
                  {activity.reason && (
                    <p className="text-sm text-muted-foreground">{activity.reason}</p>
                  )}
                  {activity.payload && Object.keys(activity.payload).length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <details className="cursor-pointer">
                        <summary>View details</summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(activity.payload, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {activities.length >= 20 && (
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing latest 20 activities
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
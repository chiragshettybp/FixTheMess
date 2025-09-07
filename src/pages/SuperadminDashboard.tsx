import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSuperadminDashboard } from '@/hooks/useSuperadminDashboard';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SuperAdminPageHeader from '@/components/superadmin/SuperAdminPageHeader';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Clock,
  Plus,
  Filter,
  Cpu,
  MemoryStick,
  HardDrive,
  Timer,
  Bell,
  Flag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickActionCard {
  title: string;
  description: string;
  icon: typeof Users;
  href: string;
  count?: number;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

const SuperadminDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const {
    stats,
    loading: dashboardLoading,
    error,
    isSuperadmin,
    refetch
  } = useSuperadminDashboard();
  
  const { metrics, loading: healthLoading } = useSystemHealth();

  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Redirect if not superadmin
  useEffect(() => {
    if (!dashboardLoading && (!user || !isSuperadmin)) {
      navigate('/auth');
    }
  }, [user, isSuperadmin, dashboardLoading, navigate]);

  // Fetch real-time activity feed
  const fetchRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('actions_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const activities: ActivityItem[] = (data || []).map(log => ({
        id: log.id,
        type: log.action,
        message: log.reason || `${log.action} performed`,
        timestamp: log.created_at,
        severity: log.action.includes('ban') || log.action.includes('flag') ? 'error' : 'info'
      }));
      
      setRecentActivity(activities);
    } catch (err) {
      console.error('Error fetching activity:', err);
    }
  };

  // Fetch system alerts
  const fetchAlerts = async () => {
    try {
      const [flaggedResult, urgentResult, errorResult] = await Promise.all([
        supabase.from('report_flags').select('id, reason').eq('status', 'pending').limit(5),
        supabase.from('reports').select('id, title').eq('status', 'urgent').limit(5),
        supabase.from('error_logs').select('id, message, severity').eq('status', 'open').limit(5)
      ]);

      const allAlerts = [
        ...(flaggedResult.data || []).map(item => ({
          id: item.id,
          type: 'flagged_report',
          message: `Report flagged: ${item.reason}`,
          severity: 'warning'
        })),
        ...(urgentResult.data || []).map(item => ({
          id: item.id,
          type: 'urgent_report',
          message: `Urgent: ${item.title}`,
          severity: 'error'
        })),
        ...(errorResult.data || []).map(item => ({
          id: item.id,
          type: 'system_error',
          message: `System: ${item.message}`,
          severity: item.severity === 'critical' ? 'error' : 'warning'
        }))
      ];

      setAlerts(allAlerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    if (isSuperadmin) {
      fetchRecentActivity();
      fetchAlerts();

      // Set up real-time subscriptions
      const activityChannel = supabase
        .channel('dashboard-activity')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'actions_log' }, fetchRecentActivity)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'report_flags' }, fetchAlerts)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchAlerts)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'error_logs' }, fetchAlerts)
        .subscribe();

      return () => {
        supabase.removeChannel(activityChannel);
      };
    }
  }, [isSuperadmin]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      fetchRecentActivity(),
      fetchAlerts()
    ]);
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const quickActions: QuickActionCard[] = [
    {
      title: 'Send Notification',
      description: 'Broadcast to users',
      icon: Bell,
      href: '/superadmin/notifications',
      variant: 'default'
    },
    {
      title: 'View Reports',
      description: `${stats.totalReports} total`,
      icon: FileText,
      href: '/superadmin/reports',
      count: stats.totalReports,
      variant: 'default'
    },
    {
      title: 'User Management',
      description: `${stats.totalUsers} users`,
      icon: Users,
      href: '/superadmin/users',
      count: stats.totalUsers,
      variant: 'secondary'
    },
    {
      title: 'System Health',
      description: 'Monitor platform',
      icon: Activity,
      href: '/superadmin/system-health',
      variant: 'default'
    },
    {
      title: 'Flagged Reports',
      description: `${stats.flaggedReports} pending`,
      icon: Flag,
      href: '/superadmin/flag-reports',
      count: stats.flaggedReports,
      variant: stats.flaggedReports > 0 ? 'outline' : 'default'
    },
    {
      title: 'Analytics',
      description: 'View insights',
      icon: BarChart3,
      href: '/superadmin/app-analytics',
      variant: 'default'
    }
  ];

  const kpiMetrics = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: '+12%',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Active Reports',
      value: stats.totalReports,
      change: '+8%',
      icon: FileText,
      trend: 'up'
    },
    {
      title: 'Urgent Issues',
      value: stats.urgentIssues,
      change: '-5%',
      icon: AlertTriangle,
      trend: 'down'
    },
    {
      title: 'Response Time',
      value: metrics.find(m => m.metric_name === 'response_time')?.value.toFixed(0) || '0',
      change: '-3%',
      icon: Timer,
      trend: 'down',
      unit: 'ms'
    }
  ];

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSuperadmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminPageHeader 
        onRefresh={handleRefresh}
        refreshing={refreshing}
        alertsCount={alerts.length}
      />

      <div className="container mx-auto p-4 space-y-6 max-w-7xl">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Access Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <Badge variant="outline">{quickActions.length} actions</Badge>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className="h-full hover:shadow-md transition-all duration-200 hover:scale-105">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`p-3 rounded-full ${
                        action.variant === 'outline' ? 'bg-yellow-100 text-yellow-600' :
                        action.variant === 'destructive' ? 'bg-red-100 text-red-600' :
                        action.variant === 'secondary' ? 'bg-green-100 text-green-600' :
                        'bg-primary/10 text-primary'
                      }`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      {action.count !== undefined && (
                        <Badge variant={action.variant} className="text-xs">
                          {action.count}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* KPI Metrics */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Key Metrics</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/superadmin/app-analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiMetrics.map((metric, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.value.toLocaleString()}{metric.unit && metric.unit}
                  </div>
                  <p className={`text-xs ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* System Health Overview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">System Health</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/superadmin/system-health">
                <Activity className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {healthLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-8 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              metrics.slice(0, 4).map((metric) => {
                const icons = {
                  cpu_usage: Cpu,
                  memory_usage: MemoryStick,
                  disk_usage: HardDrive,
                  response_time: Timer
                };
                const Icon = icons[metric.metric_name as keyof typeof icons] || Activity;
                const isPercentage = metric.unit === 'percent';
                const status = isPercentage ? 
                  (metric.value >= 90 ? 'critical' : metric.value >= 75 ? 'warning' : 'normal') :
                  (metric.value >= 1000 ? 'critical' : metric.value >= 500 ? 'warning' : 'normal');

                return (
                  <Card key={metric.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {metric.metric_name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${
                        status === 'critical' ? 'text-red-500' :
                        status === 'warning' ? 'text-yellow-500' : 'text-green-500'
                      }`} />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${
                        status === 'critical' ? 'text-red-600' :
                        status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {isPercentage ? `${metric.value.toFixed(1)}%` : `${metric.value.toFixed(0)}ms`}
                      </div>
                      <Badge variant={
                        status === 'critical' ? 'destructive' :
                        status === 'warning' ? 'outline' : 'secondary'
                      } className="text-xs mt-1">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* Alerts & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">System Alerts</h2>
              <Badge variant="outline">{alerts.length} active</Badge>
            </div>
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-80">
                  {alerts.length === 0 ? (
                    <div className="flex items-center justify-center h-80 text-muted-foreground">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No active alerts</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {alerts.map((alert, index) => (
                        <div key={alert.id || index} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className={`p-1 rounded-full ${
                            alert.severity === 'error' ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{alert.type.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground truncate">{alert.message}</p>
                          </div>
                          <Badge variant={alert.severity === 'error' ? 'destructive' : 'outline'} className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-80">
                  {recentActivity.length === 0 ? (
                    <div className="flex items-center justify-center h-80 text-muted-foreground">
                      <div className="text-center">
                        <Activity className="h-8 w-8 mx-auto mb-2" />
                        <p>No recent activity</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className={`p-1 rounded-full ${
                            activity.severity === 'error' ? 'bg-red-100 text-red-600' :
                            activity.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <Clock className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.type}</p>
                            <p className="text-sm text-muted-foreground">{activity.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="fixed bottom-4 right-4 lg:hidden">
          <div className="flex flex-col gap-2">
            <Button size="lg" className="rounded-full shadow-lg" asChild>
              <Link to="/superadmin/notifications">
                <Plus className="h-5 w-5 mr-2" />
                Quick Action
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboard;
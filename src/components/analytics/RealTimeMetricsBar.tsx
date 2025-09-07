import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Eye, 
  MousePointer, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { RealTimeMetrics } from '@/hooks/useRealTimeAnalytics';

interface RealTimeMetricsBarProps {
  metrics: RealTimeMetrics;
  loading: boolean;
}

export const RealTimeMetricsBar = ({ metrics, loading }: RealTimeMetricsBarProps) => {
  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: Users,
      description: 'Registered users',
      trend: '+12%',
      color: 'text-primary'
    },
    {
      title: 'Daily Active',
      value: metrics.dailyActiveUsers,
      icon: Activity,
      description: 'Active in last 24h',
      trend: '+8%',
      color: 'text-secondary'
    },
    {
      title: 'Total Reports',
      value: metrics.totalReports,
      icon: BarChart3,
      description: 'In selected period',
      trend: '+15%',
      color: 'text-accent'
    },
    {
      title: 'Resolved',
      value: metrics.resolvedReports,
      icon: CheckCircle,
      description: 'Successfully completed',
      trend: '+22%',
      color: 'text-green-600'
    },
    {
      title: 'Pending',
      value: metrics.pendingReports,
      icon: Clock,
      description: 'Awaiting action',
      trend: '-5%',
      color: 'text-orange-600',
      variant: metrics.pendingReports > 50 ? 'warning' : 'default'
    },
    {
      title: 'Page Views',
      value: metrics.totalViews,
      icon: Eye,
      description: 'In selected period',
      trend: '+18%',
      color: 'text-blue-600'
    },
    {
      title: 'User Taps',
      value: metrics.totalTaps,
      icon: MousePointer,
      description: 'User interactions',
      trend: '+10%',
      color: 'text-purple-600'
    },
    {
      title: 'Avg Response',
      value: `${metrics.avgResponseTime}h`,
      icon: Clock,
      description: 'Average response time',
      trend: '-12%',
      color: 'text-indigo-600'
    },
    {
      title: 'Overdue',
      value: metrics.overdueReports,
      icon: AlertTriangle,
      description: 'Urgent attention needed',
      trend: '-8%',
      color: 'text-red-600',
      variant: metrics.overdueReports > 0 ? 'destructive' : 'default'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full mb-1"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-8">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        const isPositiveTrend = metric.trend.startsWith('+');
        
        return (
          <Card key={index} className="relative group hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate">{metric.title}</CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{metric.value}</div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp 
                      className={`h-3 w-3 ${
                        isPositiveTrend ? 'text-green-600' : 'text-red-600 rotate-180'
                      }`} 
                    />
                    <span className={`text-xs font-medium ${
                      isPositiveTrend ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>

                {/* Status badges for specific metrics */}
                {metric.variant && (
                  <div className="pt-1">
                    {metric.variant === 'destructive' && metrics.overdueReports > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Urgent
                      </Badge>
                    )}
                    {metric.variant === 'warning' && metrics.pendingReports > 50 && (
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                        High Volume
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Hover effect indicator */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
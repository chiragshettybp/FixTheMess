import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BarChart3, Eye, MousePointer, Clock, Users } from 'lucide-react';
import { AnalyticsMetrics } from '@/hooks/useAppAnalytics';

interface AnalyticsMetricsBarProps {
  metrics: AnalyticsMetrics;
  loading: boolean;
}

export const AnalyticsMetricsBar = ({ metrics, loading }: AnalyticsMetricsBarProps) => {
  const metricCards = [
    {
      title: 'Total Reports',
      value: metrics.totalReports,
      icon: BarChart3,
      description: 'All time reports'
    },
    {
      title: 'Views Today',
      value: metrics.totalViews,
      icon: Eye,
      description: 'Content views today'
    },
    {
      title: 'Taps Today',
      value: metrics.totalTaps,
      icon: MousePointer,
      description: 'User interactions today'
    },
    {
      title: 'Avg Attention Time',
      value: `${metrics.avgAttentionTime}m`,
      icon: Clock,
      description: 'Average response time'
    },
    {
      title: 'Overdue Reports',
      value: metrics.overdueReports,
      icon: AlertTriangle,
      description: 'Needs urgent attention',
      variant: metrics.overdueReports > 0 ? 'destructive' : 'default'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.variant === 'destructive' && metrics.overdueReports > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    Urgent
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
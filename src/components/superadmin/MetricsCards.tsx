import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Users, 
  Zap, 
  Timer,
  Database,
  AlertTriangle
} from 'lucide-react';
import { SystemMetric } from '@/hooks/useSystemHealth';

interface MetricsCardsProps {
  metrics: SystemMetric[];
  loading: boolean;
}

const getMetricIcon = (metricName: string) => {
  switch (metricName) {
    case 'cpu_usage': return Cpu;
    case 'memory_usage': return MemoryStick;
    case 'disk_usage': return HardDrive;
    case 'active_connections': return Database;
    case 'response_time': return Timer;
    case 'api_latency': return Zap;
    case 'active_users': return Users;
    default: return AlertTriangle;
  }
};

const getMetricColor = (metricName: string, value: number) => {
  if (metricName.includes('usage')) {
    if (value >= 90) return 'text-red-500';
    if (value >= 75) return 'text-yellow-500';
    return 'text-green-500';
  }
  if (metricName === 'response_time' || metricName === 'api_latency') {
    if (value >= 1000) return 'text-red-500';
    if (value >= 500) return 'text-yellow-500';
    return 'text-green-500';
  }
  return 'text-blue-500';
};

const formatMetricValue = (metric: SystemMetric) => {
  if (metric.unit === 'percent') {
    return `${metric.value.toFixed(1)}%`;
  }
  if (metric.unit === 'milliseconds') {
    return `${metric.value.toFixed(0)}ms`;
  }
  if (metric.unit === 'count') {
    return metric.value.toLocaleString();
  }
  return `${metric.value} ${metric.unit}`;
};

const getStatusBadge = (metricName: string, value: number) => {
  if (metricName.includes('usage')) {
    if (value >= 90) return <Badge variant="destructive">Critical</Badge>;
    if (value >= 75) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Warning</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-600">Normal</Badge>;
  }
  if (metricName === 'response_time' || metricName === 'api_latency') {
    if (value >= 1000) return <Badge variant="destructive">Critical</Badge>;
    if (value >= 500) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Warning</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-600">Normal</Badge>;
  }
  return <Badge variant="outline" className="border-blue-500 text-blue-600">Active</Badge>;
};

const formatMetricName = (name: string) => {
  return name.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const MetricsCards = ({ metrics, loading }: MetricsCardsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-3 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = getMetricIcon(metric.metric_name);
        const colorClass = getMetricColor(metric.metric_name, metric.value);
        const isPercentage = metric.unit === 'percent';
        
        return (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {formatMetricName(metric.metric_name)}
              </CardTitle>
              <Icon className={`h-4 w-4 ${colorClass}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div className={`text-2xl font-bold ${colorClass}`}>
                  {formatMetricValue(metric)}
                </div>
                {getStatusBadge(metric.metric_name, metric.value)}
              </div>
              {isPercentage && (
                <Progress 
                  value={metric.value} 
                  className="w-full h-2"
                  indicatorClassName={
                    metric.value >= 90 ? "bg-red-500" :
                    metric.value >= 75 ? "bg-yellow-500" : "bg-green-500"
                  }
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(metric.timestamp).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';

import { RealTimeMetricsBar } from '@/components/analytics/RealTimeMetricsBar';
import { DateRangeFilter, DateRange } from '@/components/analytics/DateRangeFilter';
import { AnalyticsTabsContent } from '@/components/analytics/AnalyticsTabsContent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/superadmin/BackButton';

export default function SuperadminAppAnalytics() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    metrics,
    reportsData,
    usersData,
    engagementData,
    dateRange,
    loading,
    error,
    isSuperadmin,
    updateDateRange,
    refetch
  } = useRealTimeAnalytics();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!isSuperadmin) {
      navigate('/dashboard');
      return;
    }

    // Log analytics page view for tracking
    console.log('Analytics page accessed by superadmin:', user.id);
  }, [user, isSuperadmin, navigate]);

  const handleDateRangeChange = (newRange: DateRange) => {
    updateDateRange(newRange);
  };

  if (!user || !isSuperadmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        <BackButton className="mb-4" />
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Real-Time Analytics</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Live</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Monitor platform activity, user engagement, and key performance indicators in real-time
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter 
          currentRange={dateRange}
          onRangeChange={handleDateRangeChange}
        />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Real-Time Metrics */}
        <RealTimeMetricsBar metrics={metrics} loading={loading} />

        {/* Overdue Reports Alert */}
        {metrics.overdueReports > 0 && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>{metrics.overdueReports} reports</strong> need urgent attention (pending for over 24 hours)
            </AlertDescription>
          </Alert>
        )}

        {/* Analytics Tabs Content */}
        <AnalyticsTabsContent 
          reportsData={reportsData}
          usersData={usersData}
          engagementData={engagementData}
          loading={loading}
        />

        {/* Real-time Status Footer */}
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-card rounded-lg border">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Real-time data sync active</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
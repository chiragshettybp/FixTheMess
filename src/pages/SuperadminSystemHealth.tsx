import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { MetricsCards } from '@/components/superadmin/MetricsCards';
import { ErrorLogsTable } from '@/components/superadmin/ErrorLogsTable';

import { useSystemHealth } from '@/hooks/useSystemHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { BackButton } from '@/components/superadmin/BackButton';

const SuperadminSystemHealth = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const {
    metrics,
    errorLogs,
    loading,
    filters,
    updateFilters,
    clearFilters,
    updateErrorStatus,
    exportErrorLogs
  } = useSystemHealth();

  const isSuperadmin = profile?.role === 'superadmin';

  // Redirect if not superadmin
  if (!user || !isSuperadmin) {
    navigate('/auth');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const criticalErrors = errorLogs.filter(log => log.severity === 'critical' && log.status === 'open').length;
  const highErrors = errorLogs.filter(log => log.severity === 'high' && log.status === 'open').length;
  const totalOpenErrors = errorLogs.filter(log => log.status === 'open').length;

  return (
    <div className="min-h-screen bg-background">
      
      <div className="flex flex-col lg:flex-row">
        
        <div className="flex-1 p-3 sm:p-4 lg:p-8 w-full min-w-0">
          <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <BackButton />
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-8 w-8" />
                  System Health Monitor
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Real-time platform monitoring and error tracking
                </p>
              </div>
            </div>

            {/* System Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
                  <Activity className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{criticalErrors}</div>
                  <p className="text-xs text-muted-foreground">Require immediate attention</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Priority Errors</CardTitle>
                  <Activity className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">{highErrors}</div>
                  <p className="text-xs text-muted-foreground">Need attention soon</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Open Issues</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOpenErrors}</div>
                  <p className="text-xs text-muted-foreground">Unresolved errors</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Performance Metrics</h2>
              <MetricsCards metrics={metrics} loading={loading} />
            </div>

            {/* Error Logs */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Error Logs & System Issues</h2>
              <ErrorLogsTable
                errorLogs={errorLogs}
                loading={loading}
                filters={filters}
                onUpdateFilters={updateFilters}
                onClearFilters={clearFilters}
                onUpdateStatus={updateErrorStatus}
                onExport={exportErrorLogs}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminSystemHealth;
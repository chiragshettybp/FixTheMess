import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useGovernmentReports } from '@/hooks/useGovernmentReports';
import { ReportCard } from '@/components/government/ReportCard';
import { ReportDetailModal } from '@/components/government/ReportDetailModal';
import { Shield, LogOut, Settings, BarChart3, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import type { Report } from '@/hooks/useGovernmentReports';

const GovPanel = () => {
  const { signOut, profile } = useAuth();
  const { 
    reports, 
    governmentUser, 
    loading, 
    error, 
    markAsResolved, 
    getFilteredReports,
    refetch 
  } = useGovernmentReports();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeFilter, setActiveFilter] = useState('new');
  const [refreshing, setRefreshing] = useState(false);

  // Add manual refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const newReports = getFilteredReports('new');
  const urgentReports = getFilteredReports('urgent');
  const resolvedReports = getFilteredReports('resolved');

  const getActiveReports = () => {
    switch (activeFilter) {
      case 'new': return newReports;
      case 'urgent': return urgentReports;
      case 'resolved': return resolvedReports;
      default: return newReports;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Dashboard Access Issue</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            {error.includes('No region assigned') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <h3 className="font-medium text-yellow-800 mb-2">Next Steps:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Contact your system administrator</li>
                  <li>• Request region assignment for your government account</li>
                  <li>• Ensure your profile is properly configured</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Government Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Welcome, {governmentUser?.full_name || profile?.name || 'Officer'}
                </p>
                {governmentUser?.designation && (
                  <p className="text-xs text-muted-foreground">
                    {governmentUser.designation}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="flex-1 sm:flex-none text-xs sm:text-sm">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Reports</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newReports.length}</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{urgentReports.length}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedReports.length}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Section */}
        <Card>
          <CardHeader>
            <CardTitle>Complaint Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeFilter} onValueChange={setActiveFilter}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="new" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  New ({newReports.length})
                </TabsTrigger>
                <TabsTrigger value="urgent" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Urgent ({urgentReports.length})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Resolved ({resolvedReports.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeFilter} className="mt-6">
                {getActiveReports().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      {activeFilter === 'new' && 'No new reports to review'}
                      {activeFilter === 'urgent' && 'No urgent reports at this time'}
                      {activeFilter === 'resolved' && 'No resolved reports yet'}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getActiveReports().map((report) => (
                      <ReportCard
                        key={report.id}
                        report={report}
                        onViewDetails={setSelectedReport}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onMarkResolved={markAsResolved}
      />
    </div>
  );
};

export default GovPanel;
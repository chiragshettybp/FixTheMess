import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, RefreshCw, Flag, AlertTriangle, Clock, CheckCircle, XCircle, Shield, Download, Trash2 } from 'lucide-react';
import { useFlagReports, FlagReport } from '@/hooks/useFlagReports';
import FlagReportCard, { FlagReportDetailModal } from '@/components/superadmin/FlagReportCard';

import { useToast } from '@/hooks/use-toast';

const SuperadminFlagReports = () => {
  const navigate = useNavigate();
  const { flagReports, loading, error, isSuperadmin, fetchFlagReports, resolveReport, dismissReport } = useFlagReports();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<FlagReport | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filter and search reports
  const filteredReports = useMemo(() => {
    return flagReports.filter(report => {
      const matchesSearch = 
        report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.flag_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.flagged_by_user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reports?.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesType = typeFilter === 'all' || report.flag_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [flagReports, searchTerm, statusFilter, typeFilter]);

  // Get unique flag types for filter
  const flagTypes = useMemo(() => {
    const types = new Set(flagReports.map(report => report.flag_type));
    return Array.from(types);
  }, [flagReports]);

  // Get summary stats
  const stats = useMemo(() => {
    return {
      total: flagReports.length,
      pending: flagReports.filter(r => r.status === 'pending').length,
      resolved: flagReports.filter(r => r.status === 'resolved').length,
      dismissed: flagReports.filter(r => r.status === 'dismissed').length
    };
  }, [flagReports]);

  const handleViewDetails = (report: FlagReport) => {
    navigate(`/superadmin/view-flag-report/${report.id}`);
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    const newSelected = new Set(selectedReports);
    if (checked) {
      newSelected.add(reportId);
    } else {
      newSelected.delete(reportId);
    }
    setSelectedReports(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(new Set(filteredReports.map(r => r.id)));
    } else {
      setSelectedReports(new Set());
    }
  };

  const handleBulkAction = async (action: 'resolve' | 'dismiss') => {
    if (selectedReports.size === 0) {
      toast({
        title: "Error",
        description: "Please select reports to perform bulk action",
        variant: "destructive"
      });
      return;
    }

    setBulkActionLoading(true);
    const selectedArray = Array.from(selectedReports);
    const reason = `Bulk ${action} action`;
    
    try {
      const results = await Promise.all(
        selectedArray.map(id => 
          action === 'resolve' 
            ? resolveReport(id, reason)
            : dismissReport(id, reason)
        )
      );

      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast({
          title: "Success",
          description: `${successful} report(s) ${action}d successfully${failed > 0 ? `, ${failed} failed` : ''}`
        });
      }

      if (failed > 0 && successful === 0) {
        toast({
          title: "Error",
          description: `Failed to ${action} selected reports`,
          variant: "destructive"
        });
      }

      setSelectedReports(new Set());
      await fetchFlagReports();
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${action} reports`,
        variant: "destructive"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Type', 'Status', 'Reporter', 'Created', 'Reason'],
      ...filteredReports.map(report => [
        report.id,
        report.flag_type,
        report.status,
        report.flagged_by_user?.name || 'Auto-flagged',
        new Date(report.created_at).toLocaleDateString(),
        report.reason || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flag-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report data exported successfully"
    });
  };

  const handleRefresh = async () => {
    await fetchFlagReports();
    toast({
      title: "Refreshed",
      description: "Flag reports have been updated"
    });
  };

  if (!isSuperadmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-lg">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need superadmin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Reports</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Flag className="h-8 w-8" />
              Flag Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and moderate flagged content reports
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Flag className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dismissed</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.dismissed}</p>
                </div>
                <XCircle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Bulk Actions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {selectedReports.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {selectedReports.size} selected
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('resolve')}
                      disabled={bulkActionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('dismiss')}
                      disabled={bulkActionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Dismiss All
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {flagTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredReports.length} of {stats.total}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Flag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Flag Reports Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more reports.'
                  : 'No flag reports have been submitted yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div key={report.id} className="relative">
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedReports.has(report.id)}
                    onCheckedChange={(checked) => handleSelectReport(report.id, checked as boolean)}
                    className="bg-background border-2"
                  />
                </div>
                <FlagReportCard
                  report={report}
                  onViewDetails={handleViewDetails}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <FlagReportDetailModal
        report={selectedReport}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedReport(null);
        }}
      />
    </div>
  );
};

export default SuperadminFlagReports;
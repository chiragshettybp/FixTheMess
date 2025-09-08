import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Filter,
  Calendar,
  User,
  AlertTriangle,
  MoreHorizontal,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import { toast } from 'sonner';
import { BackButton } from '@/components/superadmin/BackButton';

interface Report {
  id: string;
  title: string;
  description: string;
  status: string;
  issue_type: string;
  created_at: string;
  user_id: string;
  media_url: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface ReportUser {
  id: string;
  name: string;
  email: string;
}

const SuperadminReports = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<Record<string, ReportUser>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [activeTab] = useState('reports');

  // Redirect if not superadmin
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'superadmin')) {
      navigate('/auth');
    }
  }, [user, profile, loading, navigate]);

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);

      // Fetch user details for reports
      const userIds = [...new Set(data?.map(r => r.user_id).filter(Boolean) || [])];
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        if (userError) throw userError;
        
        const userMap: Record<string, ReportUser> = {};
        userData?.forEach(user => {
          userMap[user.id] = user;
        });
        setUsers(userMap);
      }
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && profile?.role === 'superadmin') {
      fetchReports();
    }
  }, [user, profile]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user || profile?.role !== 'superadmin') return;

    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         users[report.user_id]?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    const matchesDate = dateFilter === 'all' || (() => {
      const reportDate = new Date(report.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return reportDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return reportDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return reportDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Update report status
  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;
      
      // Refresh the reports data to reflect changes
      await fetchReports();
      toast.success('Report status updated');
    } catch (err: any) {
      console.error('Error updating report status:', err);
      toast.error('Failed to update report status');
    }
  };

  // Delete report
  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      // First delete related data to avoid foreign key constraints
      await Promise.all([
        supabase.from('votes').delete().eq('report_id', reportId),
        supabase.from('abuse_reports').delete().eq('report_id', reportId),
        supabase.from('share_logs').delete().eq('report_id', reportId),
        supabase.from('views').delete().eq('content_id', reportId),
        supabase.from('report_flags').delete().eq('report_id', reportId),
        supabase.from('report_attention').delete().eq('report_id', reportId)
      ]);

      // Then delete the report itself
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      
      // Refresh the reports data
      await fetchReports();
      toast.success('Report deleted successfully');
    } catch (err: any) {
      console.error('Error deleting report:', err);
      toast.error('Failed to delete report');
    }
  };

  // Bulk actions
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedReports.size === 0) return;

    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedReports));

      if (error) throw error;
      
      // Refresh the reports data
      await fetchReports();
      toast.success(`Updated ${selectedReports.size} reports`);
      setSelectedReports(new Set());
    } catch (err: any) {
      console.error('Error updating reports:', err);
      toast.error('Failed to update reports');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedReports.size} reports? This action cannot be undone.`)) {
      return;
    }

    try {
      const reportIds = Array.from(selectedReports);
      
      // First delete related data to avoid foreign key constraints
      await Promise.all([
        supabase.from('votes').delete().in('report_id', reportIds),
        supabase.from('abuse_reports').delete().in('report_id', reportIds),
        supabase.from('share_logs').delete().in('report_id', reportIds),
        supabase.from('views').delete().in('content_id', reportIds),
        supabase.from('report_flags').delete().in('report_id', reportIds),
        supabase.from('report_attention').delete().in('report_id', reportIds)
      ]);

      // Then delete the reports
      const { error } = await supabase
        .from('reports')
        .delete()
        .in('id', reportIds);

      if (error) throw error;
      
      // Refresh the reports data
      await fetchReports();
      toast.success(`Deleted ${selectedReports.size} reports`);
      setSelectedReports(new Set());
    } catch (err: any) {
      console.error('Error deleting reports:', err);
      toast.error('Failed to delete reports');
    }
  };

  // Toggle report selection
  const toggleReportSelection = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  // Select all filtered reports
  const toggleSelectAll = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredReports.map(r => r.id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'resolved': return 'secondary';
      case 'rejected': return 'destructive';
      case 'hidden': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="flex flex-col lg:flex-row">
        
        <div className="flex-1 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <BackButton />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/superadmin" className="hover:text-foreground">SuperAdmin</Link>
                <span>→</span>
                <span>Reports Management</span>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Reports Management</h1>
                <p className="text-muted-foreground">Manage all platform reports</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports, users, IDs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>

                <div className="text-sm text-muted-foreground flex items-center">
                  Showing {filteredReports.length} of {reports.length} reports
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedReports.size > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Bulk Actions ({selectedReports.size} selected)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleBulkStatusChange('approved')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Selected
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('resolved')}>
                    Resolve Selected
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('hidden')}>
                    Hide Selected
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">All Reports</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow 
                        key={report.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/superadmin/view-report/${report.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedReports.has(report.id)}
                            onCheckedChange={() => toggleReportSelection(report.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-xs">
                          <div className="truncate">{report.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {report.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <div>
                              <div className="font-medium">{users[report.user_id]?.name || 'Anonymous'}</div>
                              <div className="text-xs text-muted-foreground">{users[report.user_id]?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={report.status}
                            onValueChange={(value) => updateReportStatus(report.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <Badge variant={getStatusColor(report.status)} className="text-xs">
                                {report.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="hidden">Hidden</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {report.issue_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(report.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/superadmin/view-report/${report.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/superadmin/report-edit/${report.id}`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => deleteReport(report.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredReports.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No reports found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your search criteria'
                      : 'No reports have been submitted yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperadminReports;
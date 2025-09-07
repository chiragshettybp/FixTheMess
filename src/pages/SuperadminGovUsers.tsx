import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Shield, Ban, Eye, Edit, ChevronRight, Filter, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGovernmentUserManagement, GovernmentUser } from '@/hooks/useGovernmentUserManagement';

import { useToast } from '@/hooks/use-toast';
import { GovUserPagination } from '@/components/superadmin/GovUserPagination';
import { supabase } from '@/integrations/supabase/client';

const SuperadminGovUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    governmentUsers,
    loading,
    error,
    isSuperadmin,
    banGovernmentUser,
    getGovernmentUsersWithStats,
    fetchRegions
  } = useGovernmentUserManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usersWithStats, setUsersWithStats] = useState<(GovernmentUser & { total_reports_handled: number })[]>([]);
  const [regions, setRegions] = useState<Array<{ id: string; name: string; state: string }>>([]);
  const [banDialog, setBanDialog] = useState<{ open: boolean; user: GovernmentUser | null }>({
    open: false,
    user: null
  });
  const [banReason, setBanReason] = useState('');
  const [banning, setBanning] = useState(false);

  // Load users with stats and regions
  const loadUsersWithStats = useCallback(async () => {
    if (governmentUsers.length > 0) {
      const [stats, regionsList] = await Promise.all([
        getGovernmentUsersWithStats(),
        fetchRegions()
      ]);
      setUsersWithStats(stats);
      setRegions(regionsList);
    }
  }, [governmentUsers, getGovernmentUsersWithStats, fetchRegions]);

  useEffect(() => {
    loadUsersWithStats();
  }, [loadUsersWithStats]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isSuperadmin) return;

    const channel = supabase
      .channel('government-users-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'government_users'
      }, () => {
        loadUsersWithStats();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users'
      }, () => {
        loadUsersWithStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSuperadmin, loadUsersWithStats]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = usersWithStats.filter(user => {
      const matchesSearch = 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.designation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.users.role === 'government') ||
        (statusFilter === 'banned' && user.users.role === 'banned');
      
      const matchesRegion = regionFilter === 'all' || 
        user.region_id === regionFilter ||
        (regionFilter === 'unassigned' && !user.region_id);
      
      return matchesSearch && matchesStatus && matchesRegion;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case 'email':
          aValue = a.users.email.toLowerCase();
          bValue = b.users.email.toLowerCase();
          break;
        case 'designation':
          aValue = a.designation.toLowerCase();
          bValue = b.designation.toLowerCase();
          break;
        case 'reports':
          aValue = a.total_reports_handled;
          bValue = b.total_reports_handled;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [usersWithStats, searchTerm, statusFilter, regionFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsersWithStats();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Government users list has been updated"
    });
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Designation', 'Region', 'Status', 'Reports Handled', 'Created'].join(','),
      ...filteredAndSortedUsers.map(user => [
        user.full_name,
        user.users.email,
        user.designation,
        user.regions ? `${user.regions.name}, ${user.regions.state}` : 'Unassigned',
        user.users.role === 'banned' ? 'Banned' : 'Active',
        user.total_reports_handled,
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `government-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleBanUser = async () => {
    if (!banDialog.user || !banReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for banning this user",
        variant: "destructive"
      });
      return;
    }

    setBanning(true);
    const result = await banGovernmentUser({
      userId: banDialog.user.user_id,
      reason: banReason
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Government user has been banned"
      });
      setBanDialog({ open: false, user: null });
      setBanReason('');
    }
    setBanning(false);
  };

  const getStatusBadge = (role: string) => {
    if (role === 'banned') {
      return <Badge variant="destructive">Banned</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
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
            <h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Government Users</h1>
            <p className="text-muted-foreground">Manage government officials and their access</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportUsers}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => navigate('/superadmin/govuser/new')} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Government User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Government Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersWithStats.length}</div>
              <p className="text-xs text-muted-foreground">Registered officials</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {usersWithStats.filter(u => u.users.role === 'government').length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
              <Ban className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {usersWithStats.filter(u => u.users.role === 'banned').length}
              </div>
              <p className="text-xs text-muted-foreground">Suspended accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or designation..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={regionFilter} 
                  onValueChange={(value) => {
                    setRegionFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={`${sortField}-${sortDirection}`} 
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-');
                    setSortField(field);
                    setSortDirection(direction as 'asc' | 'desc');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="reports-desc">Most Reports</SelectItem>
                    <SelectItem value="reports-asc">Least Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Government Users ({filteredAndSortedUsers.length} of {usersWithStats.length})</span>
              {filteredAndSortedUsers.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAndSortedUsers.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground">No government users match your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('name')}
                      >
                        Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('email')}
                      >
                        Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('designation')}
                      >
                        Designation {sortField === 'designation' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Region</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('reports')}
                      >
                        Reports {sortField === 'reports' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/superadmin/view-govuser/${user.user_id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{user.full_name}</span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              {user.designation}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{user.users.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.designation}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm">
                            {user.regions ? `${user.regions.name}` : 'Unassigned'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {user.total_reports_handled}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.users.role)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/superadmin/view-govuser/${user.user_id}`);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/superadmin/edit-govuser/${user.user_id}`);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.users.role !== 'banned' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBanDialog({ open: true, user });
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                          </div>
                        </TableCell>
                      </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination */}
            {filteredAndSortedUsers.length > 0 && (
              <div className="border-t p-4">
                <GovUserPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredAndSortedUsers.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newPageSize) => {
                    setPageSize(newPageSize);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Ban User Dialog */}
      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ open, user: banDialog.user })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Government User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You are about to ban <strong>{banDialog.user?.full_name}</strong>. This action will revoke their access to the government panel.
              </p>
            </div>
            <div>
              <Label htmlFor="ban-reason">Reason for ban (required)</Label>
              <Textarea
                id="ban-reason"
                placeholder="Explain why this user is being banned..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBanDialog({ open: false, user: null });
                  setBanReason('');
                }}
                disabled={banning}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBanUser}
                disabled={banning || !banReason.trim()}
              >
                {banning ? 'Banning...' : 'Ban User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminGovUsers;
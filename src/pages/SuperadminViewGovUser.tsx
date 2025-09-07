import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Ban, Shield, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGovernmentUserManagement, GovernmentUserWithStats } from '@/hooks/useGovernmentUserManagement';

import { useToast } from '@/hooks/use-toast';
import { GovUserActivityLog } from '@/components/superadmin/GovUserActivityLog';

const SuperadminViewGovUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    fetchGovernmentUserDetails,
    banGovernmentUser,
    unbanGovernmentUser,
    isSuperadmin
  } = useGovernmentUserManagement();

  const [user, setUser] = useState<GovernmentUserWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ban dialog state
  const [banDialog, setBanDialog] = useState({
    open: false,
    action: 'ban' as 'ban' | 'unban',
    reason: ''
  });
  const [banActionLoading, setBanActionLoading] = useState(false);

  // Load user details
  useEffect(() => {
    const loadUserDetails = async () => {
      if (!id || !isSuperadmin) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userDetails = await fetchGovernmentUserDetails(id);
        if (userDetails) {
          setUser(userDetails);
        } else {
          setError('User not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    loadUserDetails();
  }, [id, isSuperadmin]);

  const handleBanAction = async () => {
    if (!user || !id || !banDialog.reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for this action",
        variant: "destructive"
      });
      return;
    }

    setBanActionLoading(true);
    let result;

    if (banDialog.action === 'ban') {
      result = await banGovernmentUser({
        userId: id,
        reason: banDialog.reason
      });
    } else {
      result = await unbanGovernmentUser(id, banDialog.reason);
    }

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Government user ${banDialog.action === 'ban' ? 'banned' : 'unbanned'} successfully`
      });
      // Reload user data
      const updatedUser = await fetchGovernmentUserDetails(id);
      if (updatedUser) setUser(updatedUser);
      setBanDialog({ open: false, action: 'ban', reason: '' });
    }
    setBanActionLoading(false);
  };

  const getStatusBadge = (role: string) => {
    if (role === 'banned') {
      return <Badge variant="destructive">Banned</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
  };

  const getReportStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground">{error || 'User not found'}</p>
            <Button className="mt-4" onClick={() => navigate('/superadmin/govuser')}>
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/superadmin/govuser')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{user.full_name}</h1>
              <p className="text-muted-foreground">{user.designation}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/superadmin/edit-govuser/${id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
            {user.users.role === 'banned' ? (
              <Button
                onClick={() => setBanDialog({ open: true, action: 'unban', reason: '' })}
                variant="default"
              >
                <Shield className="h-4 w-4 mr-2" />
                Unban User
              </Button>
            ) : (
              <Button
                onClick={() => setBanDialog({ open: true, action: 'ban', reason: '' })}
                variant="destructive"
              >
                <Ban className="h-4 w-4 mr-2" />
                Ban User
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{user.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="font-medium">{user.users.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Designation</Label>
                    <p className="font-medium">{user.designation}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Region</Label>
                    <p className="font-medium">
                      {user.regions ? `${user.regions.name}, ${user.regions.state}` : 'No region assigned'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(user.users.role)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Joined</Label>
                    <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {user.government_id_url && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Government ID Document</Label>
                    <p className="font-medium">
                      <a 
                        href={user.government_id_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Document
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports Handled</CardTitle>
              </CardHeader>
              <CardContent>
                {user.recent_reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                    <p className="text-muted-foreground">This user hasn't handled any reports yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.recent_reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {report.title}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getReportStatusIcon(report.status)}
                                <span className="capitalize">{report.status}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {new Date(report.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/superadmin/view-report/${report.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Log */}
            <GovUserActivityLog userId={id!} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Report Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Report Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Total Handled</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{user.total_reports_handled}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <span className="text-xl font-bold text-orange-600">{user.pending_reports}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Resolved</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{user.resolved_reports}</span>
                </div>

                {user.total_reports_handled > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground">Resolution Rate</div>
                    <div className="text-lg font-bold text-green-600">
                      {Math.round((user.resolved_reports / user.total_reports_handled) * 100)}%
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Account Status</span>
                  {getStatusBadge(user.users.role)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">User ID</span>
                  <span className="text-sm font-mono text-muted-foreground">{user.user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm">{new Date(user.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Ban/Unban Dialog */}
      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banDialog.action === 'ban' ? 'Ban Government User' : 'Unban Government User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You are about to {banDialog.action} <strong>{user.full_name}</strong>. 
                {banDialog.action === 'ban' 
                  ? ' This will revoke their access to the government panel.'
                  : ' This will restore their access to the government panel.'}
              </p>
            </div>
            <div>
              <Label htmlFor="action-reason">Reason (required)</Label>
              <Textarea
                id="action-reason"
                placeholder={`Explain why this user is being ${banDialog.action === 'ban' ? 'banned' : 'unbanned'}...`}
                value={banDialog.reason}
                onChange={(e) => setBanDialog(prev => ({ ...prev, reason: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBanDialog({ open: false, action: 'ban', reason: '' })}
                disabled={banActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={banDialog.action === 'ban' ? 'destructive' : 'default'}
                onClick={handleBanAction}
                disabled={banActionLoading || !banDialog.reason.trim()}
              >
                {banActionLoading 
                  ? `${banDialog.action === 'ban' ? 'Banning' : 'Unbanning'}...` 
                  : banDialog.action === 'ban' ? 'Ban User' : 'Unban User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminViewGovUser;
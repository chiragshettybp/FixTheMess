import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Ban, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useGovernmentUserManagement, GovernmentUserWithStats } from '@/hooks/useGovernmentUserManagement';

import { useToast } from '@/hooks/use-toast';
import { GovUserActivityLog } from '@/components/superadmin/GovUserActivityLog';

const SuperadminEditGovUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    fetchGovernmentUserDetails,
    updateGovernmentUser,
    banGovernmentUser,
    unbanGovernmentUser,
    fetchRegions,
    isSuperadmin
  } = useGovernmentUserManagement();

  const [user, setUser] = useState<GovernmentUserWithStats | null>(null);
  const [regions, setRegions] = useState<Array<{ id: string; name: string; state: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    designation: '',
    region_id: '',
    government_id_url: '',
    email: ''
  });

  // Ban/Unban dialog state
  const [banDialog, setBanDialog] = useState({
    open: false,
    action: 'ban' as 'ban' | 'unban',
    reason: ''
  });
  const [banActionLoading, setBanActionLoading] = useState(false);

  // Load user details and regions
  useEffect(() => {
    const loadData = async () => {
      if (!id || !isSuperadmin) return;

      try {
        setLoading(true);
        const [userDetails, regionsList] = await Promise.all([
          fetchGovernmentUserDetails(id),
          fetchRegions()
        ]);

        if (userDetails) {
          setUser(userDetails);
          setFormData({
            full_name: userDetails.full_name,
            designation: userDetails.designation,
            region_id: userDetails.region_id || '',
            government_id_url: userDetails.government_id_url || '',
            email: userDetails.users.email
          });
        }
        setRegions(regionsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isSuperadmin, fetchGovernmentUserDetails, fetchRegions]);

  const handleSave = async () => {
    if (!user || !id) return;

    setSaving(true);
    const result = await updateGovernmentUser(id, {
      ...formData,
      users: { email: formData.email, role: 'government' }
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
        description: "Government user updated successfully"
      });
      navigate(`/superadmin/view-govuser/${id}`);
    }
    setSaving(false);
  };

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
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/superadmin/govuser')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Government User</h1>
            <p className="text-muted-foreground">Update user information and status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="Enter designation/role"
                  />
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select 
                    value={formData.region_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, region_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No region assigned</SelectItem>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}, {region.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="government_id_url">Government ID Document URL</Label>
                  <Input
                    id="government_id_url"
                    value={formData.government_id_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, government_id_url: e.target.value }))}
                    placeholder="Enter document URL (optional)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/superadmin/view-govuser/${id}`)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Status:</span>
                  {getStatusBadge(user.users.role)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                  <p>Last Updated: {new Date(user.updated_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Report Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Report Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Handled:</span>
                  <span className="font-medium">{user.total_reports_handled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pending:</span>
                  <span className="font-medium text-orange-600">{user.pending_reports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resolved:</span>
                  <span className="font-medium text-green-600">{user.resolved_reports}</span>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {user.users.role === 'banned' ? (
                  <Button
                    onClick={() => setBanDialog({ open: true, action: 'unban', reason: '' })}
                    className="w-full"
                    variant="default"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Unban User
                  </Button>
                ) : (
                  <Button
                    onClick={() => setBanDialog({ open: true, action: 'ban', reason: '' })}
                    className="w-full"
                    variant="destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban User
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Activity Log */}
            <GovUserActivityLog userId={id!} />
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

export default SuperadminEditGovUser;
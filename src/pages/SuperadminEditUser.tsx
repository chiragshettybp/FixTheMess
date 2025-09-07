import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Save,
  Ban,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  is_anonymous: boolean;
}

interface UserStatus {
  status: string;
  reasons: string[];
}

const SuperadminEditUser = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banReason, setBanReason] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: ''
  });

  const isSuperadmin = profile?.role === 'superadmin';

  // Redirect if not superadmin
  useEffect(() => {
    if (!loading && (!user || !isSuperadmin)) {
      navigate('/auth');
    }
  }, [user, isSuperadmin, loading, navigate]);

  // Fetch user data
  const fetchUserData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Get user data
      const { data: userDataResult, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (userError) throw userError;

      // Get user status (use maybeSingle to handle missing records)
      const { data: statusResult, error: statusError } = await supabase
        .from('user_status')
        .select('status, reasons')
        .eq('user_id', id)
        .maybeSingle();

      if (statusError) {
        throw statusError;
      }

      setUserData(userDataResult);
      setUserStatus(statusResult || { status: 'active', reasons: [] });
      
      // Initialize form data
      setFormData({
        name: userDataResult.name,
        email: userDataResult.email,
        role: userDataResult.role,
        status: statusResult?.status || 'active'
      });
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
      navigate('/superadmin/user');
    } finally {
      setLoading(false);
    }
  };

  // Save user changes
  const saveChanges = async () => {
    if (!id || !userData) return;
    
    try {
      setSaving(true);
      console.log('Starting save process...', { formData, userStatus });
      
      // Step 1: Update user data first
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email,
          role: formData.role as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (userError) {
        console.error('User update error:', userError);
        throw userError;
      }
      console.log('User table updated successfully');

      // Step 2: Handle government users table
      if (formData.role === 'government') {
        // First check if government user exists
        const { data: existingGovUser } = await supabase
          .from('government_users')
          .select('id')
          .eq('user_id', id)
          .maybeSingle();

        if (existingGovUser) {
          // Update existing government user
          const { error: govUpdateError } = await supabase
            .from('government_users')
            .update({
              full_name: formData.name,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', id);

          if (govUpdateError) {
            console.error('Government user update error:', govUpdateError);
            throw govUpdateError;
          }
          console.log('Government user updated successfully');
        } else {
          // Create new government user
          const { error: govInsertError } = await supabase
            .from('government_users')
            .insert({
              user_id: id,
              full_name: formData.name,
              designation: 'Government Official',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (govInsertError) {
            console.error('Government user insert error:', govInsertError);
            throw govInsertError;
          }
          console.log('Government user created successfully');
        }
      }

      // Step 3: Handle user status (always update or create)
      const statusUpdate = { 
        status: formData.status,
        updated_at: new Date().toISOString(),
        reasons: formData.status === 'banned' && banReason.trim() ? [banReason] : 
                 formData.status === 'active' ? [] : 
                 userStatus?.reasons || []
      };

      // First check if user_status record exists
      const { data: existingStatus } = await supabase
        .from('user_status')
        .select('id')
        .eq('user_id', id)
        .maybeSingle();

      if (existingStatus) {
        // Update existing status
        const { error: statusUpdateError } = await supabase
          .from('user_status')
          .update(statusUpdate)
          .eq('user_id', id);

        if (statusUpdateError) {
          console.error('Status update error:', statusUpdateError);
          throw statusUpdateError;
        }
        console.log('User status updated successfully');
      } else {
        // Create new status record
        const { error: statusInsertError } = await supabase
          .from('user_status')
          .insert({
            user_id: id,
            ...statusUpdate,
            strike_count: 0,
            created_at: new Date().toISOString()
          });

        if (statusInsertError) {
          console.error('Status insert error:', statusInsertError);
          throw statusInsertError;
        }
        console.log('User status created successfully');
      }

      // Step 4: Log the action
      const { error: logError } = await supabase
        .from('actions_log')
        .insert({
          action: formData.status === 'banned' ? 'user_banned' : 'user_updated',
          actor_id: user?.id,
          target_user_id: id,
          reason: formData.status === 'banned' ? banReason : 'User details updated',
          payload: {
            old_role: userData.role,
            new_role: formData.role,
            old_name: userData.name,
            new_name: formData.name,
            old_email: userData.email,
            new_email: formData.email,
            old_status: userStatus?.status,
            new_status: formData.status
          }
        });

      if (logError) {
        console.error('Action log error:', logError);
        // Don't throw here, just log the error
      }

      console.log('Save process completed successfully');
      
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      // Refresh the user data to show changes immediately
      await fetchUserData();
      
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: "Failed to save user changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (isSuperadmin) {
      fetchUserData();
    }
  }, [id, isSuperadmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperadmin || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row">
        
        <div className="flex-1 p-3 sm:p-4 lg:p-8 w-full min-w-0">
          <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/superadmin/user')}
                className="w-fit"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Edit User</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Modify user details and permissions</p>
              </div>
            </div>

            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  User Information
                  {userData.role === 'banned' && (
                    <Badge variant="destructive">Banned</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Account Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Ban Reason Input */}
                {formData.status === 'banned' && (
                  <div className="space-y-2">
                    <Label htmlFor="banReason">Ban Reason</Label>
                    <Textarea
                      id="banReason"
                      placeholder="Enter reason for banning this user..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Current Ban Reasons */}
                {userStatus?.reasons && userStatus.reasons.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Ban Reasons</Label>
                    <div className="space-y-2">
                      {userStatus.reasons.map((reason, index) => (
                        <div key={index} className="p-3 bg-muted rounded-md text-sm">
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">User ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">{userData.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Type</Label>
                    <p className="text-sm text-muted-foreground">
                      {userData.is_anonymous ? 'Anonymous' : 'Registered'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Join Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(userData.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current Status</Label>
                    <div className="flex items-center gap-2">
                      {userData.role === 'banned' ? (
                        <>
                          <Ban className="h-4 w-4 text-red-600" />
                          <Badge variant="destructive">Banned</Badge>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <Badge variant="default">Active</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={saveChanges}
                disabled={saving}
                className="flex-1 sm:flex-none"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/superadmin/user')}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminEditUser;
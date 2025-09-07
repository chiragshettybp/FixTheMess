import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search,
  UserCheck,
  Ban,
  AlertTriangle
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { useAllUsers } from '@/hooks/useAllUsers';
import { UserTable } from '@/components/superadmin/UserTable';
import { UserPagination } from '@/components/superadmin/UserPagination';
import { supabase } from '@/integrations/supabase/client';

const SuperadminUsers = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [banReason, setBanReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const isSuperadmin = profile?.role === 'superadmin';

  // Use the simple all users hook
  const {
    users,
    loading,
    currentPage,
    totalCount,
    totalPages,
    itemsPerPage,
    setCurrentPage,
    refetch
  } = useAllUsers();

  // Redirect if not superadmin
  if (!user || !isSuperadmin) {
    navigate('/auth');
    return null;
  }

  // Ban user with reason
  const banUser = async (userId: string) => {
    if (!banReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a ban reason",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update user role to banned
      const { error: userError } = await supabase
        .from('users')
        .update({ role: 'banned' })
        .eq('id', userId);

      if (userError) throw userError;

      // Update user status - using INSERT instead of UPSERT to avoid conflicts
      const { error: statusError } = await supabase
        .from('user_status')
        .update({ 
          status: 'banned',
          reasons: [banReason],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (statusError) throw statusError;

      // Log the action
      await supabase
        .from('actions_log')
        .insert({
          action: 'user_banned',
          actor_id: user?.id,
          target_user_id: userId,
          reason: banReason,
          payload: { ban_reason: banReason }
        });

      toast({
        title: "User Banned",
        description: "User has been banned successfully",
      });

      setBanReason('');
      setSelectedUserId(null);
      refetch(); // Refresh the list
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  // Unban user
  const unbanUser = async (userId: string) => {
    try {
      // Update user role back to user
      const { error: userError } = await supabase
        .from('users')
        .update({ role: 'user' })
        .eq('id', userId);

      if (userError) throw userError;

      // Update user status
      const { error: statusError } = await supabase
        .from('user_status')
        .upsert({ 
          user_id: userId,
          status: 'active',
          reasons: []
        });

      if (statusError) throw statusError;

      // Log the action
      await supabase
        .from('actions_log')
        .insert({
          action: 'user_unbanned',
          actor_id: user?.id,
          target_user_id: userId,
          reason: 'User unbanned by superadmin'
        });

      toast({
        title: "User Unbanned",
        description: "User has been unbanned successfully",
      });

      refetch(); // Refresh the list
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    }
  };

  // Handle ban user action
  const handleBanUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  // Handle unban user action  
  const handleUnbanUser = (userId: string) => {
    unbanUser(userId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row">
        
        <div className="flex-1 p-3 sm:p-4 lg:p-8 w-full min-w-0">
          <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">User Management</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Manage all platform users</p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCount}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter(u => u.role !== 'banned' && u.status === 'active').length}</div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
                  <Ban className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter(u => u.role === 'banned').length}</div>
                  <p className="text-xs text-muted-foreground">Suspended accounts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.reduce((sum, u) => sum + u.report_count, 0)}</div>
                  <p className="text-xs text-muted-foreground">Reports filed</p>
                </CardContent>
              </Card>
            </div>


            {/* Users Table */}
            <UserTable
              users={users}
              loading={loading}
              currentPage={currentPage}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onBanUser={handleBanUser}
              onUnbanUser={handleUnbanUser}
            />

            {/* Pagination */}
            <UserPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Ban User Dialog */}
      <AlertDialog open={selectedUserId !== null} onOpenChange={() => setSelectedUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban this user? This action will revoke their access to the platform. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter ban reason..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBanReason('');
              setSelectedUserId(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUserId) {
                  banUser(selectedUserId);
                }
              }}
              disabled={!banReason.trim()}
            >
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperadminUsers;
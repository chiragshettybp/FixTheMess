import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Edit,
  Ban,
  UserCheck,
  FileText,
  Calendar,
  Mail,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Flag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  strike_count: number;
}

interface ReportData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  issue_type: string;
}

interface UserAnalytics {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  flaggedReports: number;
  recentReports: ReportData[];
}

const SuperadminViewUser = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [banReason, setBanReason] = useState('');

  const isSuperadmin = profile?.role === 'superadmin';

  // Redirect if not superadmin
  useEffect(() => {
    if (!loading && (!user || !isSuperadmin)) {
      navigate('/auth');
    }
  }, [user, isSuperadmin, loading, navigate]);

  // Fetch all user data
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

      // Get user status
      const { data: statusResult, error: statusError } = await supabase
        .from('user_status')
        .select('status, reasons, strike_count')
        .eq('user_id', id)
        .single();

      if (statusError && statusError.code !== 'PGRST116') {
        throw statusError;
      }

      // Get user reports
      const { data: reportsResult, error: reportsError } = await supabase
        .from('reports')
        .select('id, title, status, created_at, issue_type')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Calculate analytics
      const reportsData = reportsResult || [];
      const analyticsData: UserAnalytics = {
        totalReports: reportsData.length,
        pendingReports: reportsData.filter(r => r.status === 'pending').length,
        resolvedReports: reportsData.filter(r => r.status === 'resolved').length,
        flaggedReports: reportsData.filter(r => r.status === 'flagged').length,
        recentReports: reportsData.slice(0, 5)
      };

      setUserData(userDataResult);
      setUserStatus(statusResult || { status: 'active', reasons: [], strike_count: 0 });
      setAnalytics(analyticsData);
      
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

  // Ban user
  const banUser = async (reason: string) => {
    if (!id || !userData) return;
    
    try {
      // Update user role to banned
      const { error: userError } = await supabase
        .from('users')
        .update({ role: 'banned' })
        .eq('id', id);

      if (userError) throw userError;

      // Update user status
      const { error: statusError } = await supabase
        .from('user_status')
        .upsert({
          user_id: id,
          status: 'banned',
          reasons: [...(userStatus?.reasons || []), reason],
          strike_count: (userStatus?.strike_count || 0) + 1
        });

      if (statusError) throw statusError;

      // Log the action
      await supabase
        .from('actions_log')
        .insert({
          action: 'user_banned',
          actor_id: user?.id,
          target_user_id: id,
          reason,
          payload: { ban_reason: reason }
        });

      toast({
        title: "User Banned",
        description: "User has been banned successfully",
      });

      // Refresh data
      fetchUserData();
      setBanReason('');
      
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!isSuperadmin || !id) return;

    fetchUserData();

    const channel = supabase
      .channel(`user-${id}-realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${id}` }, () => {
        fetchUserData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_status', filter: `user_id=eq.${id}` }, () => {
        fetchUserData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `user_id=eq.${id}` }, () => {
        fetchUserData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, isSuperadmin]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'flagged':
        return <Flag className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'resolved':
        return <Badge variant="default">Resolved</Badge>;
      case 'flagged':
        return <Badge variant="destructive">Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperadmin || !userData || !analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="flex flex-col lg:flex-row">
        
        <div className="flex-1 p-3 sm:p-4 lg:p-8 w-full min-w-0">
          <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/superadmin/user')}
                  className="w-fit"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Button>
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">User Details</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">{userData.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/superadmin/edit-user/${id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                {userData.role !== 'banned' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Ban className="h-4 w-4 mr-2" />
                        Ban User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ban User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to ban this user? Please provide a reason.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Textarea
                        placeholder="Enter ban reason..."
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBanReason('')}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            if (banReason.trim()) {
                              banUser(banReason);
                            }
                          }}
                          disabled={!banReason.trim()}
                        >
                          Ban User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                  {userData.role === 'banned' ? (
                    <Badge variant="destructive">Banned</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <User className="h-4 w-4" />
                        Full Name
                      </div>
                      <p className="text-lg">{userData.name}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </div>
                      <p className="text-lg">{userData.email}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Calendar className="h-4 w-4" />
                        Join Date
                      </div>
                      <p className="text-lg">
                        {new Date(userData.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Account Type</div>
                      <Badge variant="outline">
                        {userData.is_anonymous ? 'Anonymous' : 'Registered'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Current Status</div>
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
                    <div>
                      <div className="text-sm font-medium mb-1">Strike Count</div>
                      <Badge variant={userStatus?.strike_count && userStatus.strike_count > 0 ? "destructive" : "outline"}>
                        {userStatus?.strike_count || 0} strikes
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Ban Reasons */}
                {userStatus?.reasons && userStatus.reasons.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <div className="text-sm font-medium text-red-600">Ban Reasons</div>
                    <div className="space-y-2">
                      {userStatus.reasons.map((reason, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reports Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalReports}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.pendingReports}</div>
                  <p className="text-xs text-muted-foreground">Awaiting action</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.resolvedReports}</div>
                  <p className="text-xs text-muted-foreground">Successfully handled</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flagged</CardTitle>
                  <Flag className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.flaggedReports}</div>
                  <p className="text-xs text-muted-foreground">Requires review</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.recentReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports found for this user
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead className="hidden sm:table-cell">Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.recentReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">
                              <div className="max-w-[200px] truncate">
                                {report.title}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline" className="text-xs">
                                {report.issue_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(report.status)}
                                {getStatusBadge(report.status)}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {new Date(report.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <Link to={`/superadmin/view-report/${report.id}`}>
                                  View
                                </Link>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminViewUser;
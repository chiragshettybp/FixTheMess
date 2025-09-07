import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  FileText, 
  Flag, 
  Calendar, 
  MapPin, 
  Settings, 
  LogOut,
  Edit,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  status: string;
  created_at: string;
  media_url: string;
  issue_type: string;
}

interface AbuseReport {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  report_id: string;
}

interface ActivitySummary {
  totalReports: number;
  resolvedReports: number;
  flagsSubmitted: number;
  votesReceived: number;
}

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [abuseReports, setAbuseReports] = useState<AbuseReport[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    totalReports: 0,
    resolvedReports: 0,
    flagsSubmitted: 0,
    votesReceived: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user's reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('id, title, status, created_at, media_url, issue_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch user's abuse reports
      const { data: abuseReportsData, error: abuseError } = await supabase
        .from('abuse_reports')
        .select('id, reason, status, created_at, report_id')
        .eq('flagged_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (abuseError) throw abuseError;

      // Fetch votes received on user's reports
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('id')
        .in('report_id', reportsData?.map(r => r.id) || []);

      if (votesError) throw votesError;

      setReports(reportsData || []);
      setAbuseReports(abuseReportsData || []);
      
      const resolvedCount = reportsData?.filter(r => r.status === 'resolved').length || 0;
      
      setActivitySummary({
        totalReports: reportsData?.length || 0,
        resolvedReports: resolvedCount,
        flagsSubmitted: abuseReportsData?.length || 0,
        votesReceived: votesData?.length || 0,
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      navigate('/auth');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'under_review':
        return <Eye className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* User Info Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl font-semibold">
                {profile?.name ? getInitials(profile.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile?.name || 'User'}</h1>
              <p className="text-muted-foreground">{profile?.email}</p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {profile?.role && (
                  <Badge variant="secondary">
                    <User className="h-3 w-3 mr-1" />
                    {profile.role.toUpperCase()}
                  </Badge>
                )}
                {profile?.is_anonymous && (
                  <Badge variant="outline">Anonymous</Badge>
                )}
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => navigate('/settings')} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{activitySummary.totalReports}</div>
            <p className="text-sm text-muted-foreground">Reports Filed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activitySummary.resolvedReports}</div>
            <p className="text-sm text-muted-foreground">Reports Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{activitySummary.flagsSubmitted}</div>
            <p className="text-sm text-muted-foreground">Flags Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{activitySummary.votesReceived}</div>
            <p className="text-sm text-muted-foreground">Helpful Votes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* My Reports Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No reports submitted yet</p>
            ) : (
              <div className="space-y-4">
                {reports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate(`/report/${report.id}`)}
                  >
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {report.media_url ? (
                        <img 
                          src={report.media_url} 
                          alt={report.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{report.title}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{report.issue_type}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(report.status)}`}
                        >
                          {getStatusIcon(report.status)}
                          {report.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {reports.length > 5 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/my-reports')}
                    className="w-full"
                  >
                    View All Reports
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flag History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Flag History ({abuseReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {abuseReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No flags submitted yet</p>
            ) : (
              <div className="space-y-4">
                {abuseReports.slice(0, 5).map((abuseReport) => (
                  <div
                    key={abuseReport.id}
                    className="p-3 rounded-lg border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{abuseReport.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(abuseReport.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(abuseReport.status)}`}
                      >
                        {abuseReport.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settings Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/settings')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Separator />
            <Button 
              variant="destructive" 
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
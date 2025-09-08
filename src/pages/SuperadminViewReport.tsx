import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  Edit,
  Trash2,
  MapPin,
  Calendar,
  User,
  Image as ImageIcon,
  Download,
  AlertTriangle,
  ExternalLink
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
  media_url: string;
  user_id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolved_image_url?: string;
}

interface ReportUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

const SuperadminViewReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [reporter, setReporter] = useState<ReportUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab] = useState('reports');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Redirect if not superadmin
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'superadmin')) {
      navigate('/auth');
    }
  }, [user, profile, loading, navigate]);

  // Fetch report data
  useEffect(() => {
    if (!id || !user || profile?.role !== 'superadmin') return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setReport(data);
          
          // Fetch reporter details if available
          if (data.user_id) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, name, email, avatar_url')
              .eq('id', data.user_id)
              .single();

            if (!userError && userData) {
              setReporter(userData);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching report:', err);
        setError(err.message);
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, user, profile]);

  // Set up realtime subscription
  useEffect(() => {
    if (!id || !user || profile?.role !== 'superadmin') return;

    const channel = supabase
      .channel(`report-${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${id}` }, 
        (payload) => {
          setReport(payload.new as Report);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, profile]);

  // Update report status
  const updateReportStatus = async (newStatus: string) => {
    if (!report) return;

    setUpdatingStatus(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // If marking as resolved, add resolved timestamp
      if (newStatus === 'resolved' && report.status !== 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id;
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', report.id);

      if (error) throw error;

      toast.success('Report status updated');
    } catch (err: any) {
      console.error('Error updating report status:', err);
      toast.error('Failed to update report status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete report
  const deleteReport = async () => {
    if (!report) return;

    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);

      if (error) throw error;

      toast.success('Report deleted successfully');
      navigate('/superadmin/reports');
    } catch (err: any) {
      console.error('Error deleting report:', err);
      toast.error('Failed to delete report');
    }
  };

  // Download image
  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex-1 p-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || 'Report not found'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      
      <div className="flex flex-col lg:flex-row">
        
        <div className="flex-1 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <BackButton to="/superadmin/reports" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/superadmin" className="hover:text-foreground">SuperAdmin</Link>
                <span>→</span>
                <Link to="/superadmin/reports" className="hover:text-foreground">Reports</Link>
                <span>→</span>
                <span>Report #{report.id.slice(0, 8)}</span>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold">{report.title}</h1>
                <Badge variant={getStatusColor(report.status)}>{report.status}</Badge>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/superadmin/report-edit/${report.id}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Report
                  </Link>
                </Button>
                
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={deleteReport}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/report/${report.id}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Public View
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Report Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {report.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Issue Type</label>
                      <Badge variant="outline" className="ml-2">
                        {report.issue_type}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <div className="mt-1">
                        <Select
                          value={report.status}
                          onValueChange={updateReportStatus}
                          disabled={updatingStatus}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media */}
              {report.media_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative group">
                      <img
                        src={report.media_url}
                        alt="Report media"
                        className="w-full max-w-lg rounded-lg border cursor-pointer"
                        onClick={() => window.open(report.media_url, '_blank')}
                      />
                      <Button
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => downloadImage(report.media_url, `report-${report.id}.jpg`)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Coordinates:</span>{' '}
                      {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://maps.google.com?q=${report.latitude},${report.longitude}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Maps
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Details */}
              {(report.status === 'resolved' && report.resolved_at) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Resolution Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Resolved At</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.resolved_at).toLocaleString()}
                      </p>
                    </div>
                    
                    {report.resolved_image_url && (
                      <div>
                        <label className="text-sm font-medium">Resolution Image</label>
                        <div className="mt-2">
                          <img
                            src={report.resolved_image_url}
                            alt="Resolution"
                            className="max-w-xs rounded-lg border cursor-pointer"
                            onClick={() => window.open(report.resolved_image_url, '_blank')}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Reporter Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Reporter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reporter ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {reporter.avatar_url ? (
                          <img 
                            src={reporter.avatar_url} 
                            alt={reporter.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{reporter.name}</p>
                          <p className="text-sm text-muted-foreground">{reporter.email}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Anonymous report</p>
                  )}
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.updated_at).toLocaleString()}
                    </p>
                  </div>

                  {report.resolved_at && (
                    <div>
                      <label className="text-sm font-medium">Resolved</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.resolved_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Report ID */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Report ID</label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {report.id}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminViewReport;
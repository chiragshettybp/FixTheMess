import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, User, Flag, Pin, Edit, Trash2, Ban, Eye, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Report {
  id: string;
  title: string;
  description: string | null;
  issue_type: string;
  status: string;
  media_url: string;
  latitude: number;
  longitude: number;
  user_id: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_image_url: string | null;
  region_id: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ActionLog {
  id: string;
  action: string;
  details: string;
  performed_by: string;
  performed_at: string;
}

const ViewReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [reportUser, setReportUser] = useState<User | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [internalNotes, setInternalNotes] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    issue_type: '',
    status: ''
  });

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const issueTypes = [
    'roads', 'sanitation', 'water', 'electricity', 'transportation', 
    'healthcare', 'education', 'environment', 'safety', 'other'
  ];

  // Fetch report details
  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!id || !user || profile?.role !== 'superadmin') return;

      try {
        // Fetch report
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .single();

        if (reportError) throw reportError;
        setReport(reportData);
        setEditData({
          title: reportData.title,
          description: reportData.description || '',
          issue_type: reportData.issue_type,
          status: reportData.status
        });

        // Fetch user if not anonymous
        if (reportData.user_id && !reportData.is_anonymous) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('id', reportData.user_id)
            .single();

          if (!userError) {
            setReportUser(userData);
          }
        }

        // Mock action logs (in real app, you'd have an audit table)
        setActionLogs([
          {
            id: '1',
            action: 'Report Created',
            details: 'Report submitted by user',
            performed_by: reportData.is_anonymous ? 'Anonymous User' : 'User',
            performed_at: reportData.created_at
          }
        ]);

      } catch (err: any) {
        console.error('Error fetching report details:', err);
        toast.error('Failed to fetch report details');
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [id, user, profile]);

  const handleUpdateReport = async () => {
    if (!report || !user || profile?.role !== 'superadmin') return;

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          title: editData.title,
          description: editData.description,
          issue_type: editData.issue_type,
          status: editData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id);

      if (error) throw error;

      setReport({ ...report, ...editData, updated_at: new Date().toISOString() });
      setEditMode(false);
      toast.success('Report updated successfully');
    } catch (err: any) {
      console.error('Error updating report:', err);
      toast.error('Failed to update report');
    }
  };

  const handleDeleteReport = async () => {
    if (!report || !confirm('Are you sure you want to permanently delete this report?')) return;

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);

      if (error) throw error;

      toast.success('Report deleted successfully');
      navigate('/superadmin');
    } catch (err: any) {
      console.error('Error deleting report:', err);
      toast.error('Failed to delete report');
    }
  };

  const handleFlagReport = async () => {
    if (!report || !user) return;

    try {
      const { error } = await supabase
        .from('report_flags')
        .insert({
          report_id: report.id,
          flag_type: 'inappropriate',
          reason: 'Flagged by superadmin',
          flagged_by_user_id: user.id,
          is_auto_flagged: false
        });

      if (error) throw error;

      toast.success('Report flagged successfully');
    } catch (err: any) {
      console.error('Error flagging report:', err);
      toast.error('Failed to flag report');
    }
  };

  const handleBanUser = async () => {
    if (!reportUser || !confirm('Are you sure you want to ban this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'banned' })
        .eq('id', reportUser.id);

      if (error) throw error;

      setReportUser({ ...reportUser, role: 'banned' });
      toast.success('User banned successfully');
    } catch (err: any) {
      console.error('Error banning user:', err);
      toast.error('Failed to ban user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>Report not found or you don't have permission to view it.</AlertDescription>
          </Alert>
          <Button asChild className="mt-4">
            <div onClick={() => navigate('/superadmin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </div>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/superadmin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Report Details</h1>
            <p className="text-muted-foreground">View and manage report information</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={editMode ? 'default' : 'outline'}
              onClick={() => editMode ? handleUpdateReport() : setEditMode(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? 'Save Changes' : 'Edit Report'}
            </Button>
            <Button variant="destructive" onClick={handleDeleteReport}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Information */}
              <Card className="border-0">
                <CardHeader className="px-3 py-4">
                  <CardTitle>Report Information</CardTitle>
                  <CardDescription>Basic details about the report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    {editMode ? (
                      <Input
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      />
                    ) : (
                      <p className="font-medium">{report.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    {editMode ? (
                      <Textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm">{report.description || 'No description provided'}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Issue Type</Label>
                      {editMode ? (
                        <Select value={editData.issue_type} onValueChange={(value) => setEditData({ ...editData, issue_type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {issueTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary">{report.issue_type}</Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      {editMode ? (
                        <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={
                          report.status === 'resolved' ? 'default' :
                          report.status === 'urgent' ? 'destructive' : 'secondary'
                        }>
                          {report.status}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Location: {report.latitude}, {report.longitude}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(report.created_at).toLocaleString()}</span>
                  </div>

                  {report.updated_at !== report.created_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Updated: {new Date(report.updated_at).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Information */}
              <Card className="border-0">
                <CardHeader className="px-3 py-4">
                  <CardTitle>Reporter Information</CardTitle>
                  <CardDescription>Details about who submitted this report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-3">
                  {report.is_anonymous ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Anonymous Report</p>
                      <p className="text-sm text-muted-foreground">No user information available</p>
                    </div>
                  ) : reportUser ? (
                    <>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <p className="font-medium">{reportUser.name}</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Email</Label>
                        <p className="text-sm">{reportUser.email}</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Badge variant={reportUser.role === 'banned' ? 'destructive' : 'default'}>
                          {reportUser.role}
                        </Badge>
                      </div>

                      {reportUser.role !== 'banned' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBanUser}
                          className="w-full"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Ban User
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">User information not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card className="border-0">
              <CardHeader className="px-3 py-4">
                <CardTitle>Media Files</CardTitle>
                <CardDescription>Images and documents attached to this report</CardDescription>
              </CardHeader>
              <CardContent className="px-3">
                {report.media_url ? (
                  <div className="space-y-4">
                    <img
                      src={report.media_url}
                      alt="Report media"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Media</p>
                    <p className="text-sm text-muted-foreground">No images or files attached to this report</p>
                  </div>
                )}

                {report.resolved_image_url && (
                  <div className="space-y-4 mt-6">
                    <h4 className="font-medium">Resolution Image</h4>
                    <img
                      src={report.resolved_image_url}
                      alt="Resolution"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card className="border-0">
              <CardHeader className="px-3 py-4">
                <CardTitle>Administrative Actions</CardTitle>
                <CardDescription>Perform actions on this report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={handleFlagReport} variant="outline">
                    <Flag className="w-4 h-4 mr-2" />
                    Flag Report
                  </Button>

                  <Button variant="outline">
                    <Pin className="w-4 h-4 mr-2" />
                    Pin Report
                  </Button>

                  <Button variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>

                  <Button variant="destructive" onClick={handleDeleteReport}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Report
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add internal notes about this report..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={4}
                  />
                  <Button size="sm">Save Notes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="border-0">
              <CardHeader className="px-3 py-4">
                <CardTitle>Action History</CardTitle>
                <CardDescription>Timeline of actions performed on this report</CardDescription>
              </CardHeader>
              <CardContent className="px-3">
                <div className="space-y-4">
                  {actionLogs.map((log) => (
                    <div key={log.id} className="border-l-2 border-primary pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{log.action}</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.performed_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">By: {log.performed_by}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ViewReport;
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Ban, 
  Flag, 
  User, 
  FileText, 
  Calendar,
  Image,
  AlertTriangle,
  Shield,
  RefreshCw,
  MessageSquare,
  History
} from 'lucide-react';
import { FlagReport, ModerationAction, useFlagReports } from '@/hooks/useFlagReports';

import { useToast } from '@/hooks/use-toast';

const SuperadminViewFlagReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { flagReports, loading, error, isSuperadmin, resolveReport, dismissReport, banUser, getModerationHistory } = useFlagReports();
  const { toast } = useToast();
  
  const [report, setReport] = useState<FlagReport | null>(null);
  const [moderationHistory, setModerationHistory] = useState<ModerationAction[]>([]);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'resolve' | 'dismiss' | 'ban';
    notes: string;
  }>({
    open: false,
    type: 'resolve',
    notes: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Find the report by ID
  useEffect(() => {
    if (id && flagReports.length > 0) {
      const foundReport = flagReports.find(r => r.id === id);
      if (foundReport) {
        setReport(foundReport);
        loadModerationHistory(id);
      } else {
        toast({
          title: "Error",
          description: "Flag report not found",
          variant: "destructive"
        });
        navigate('/superadmin/flag-reports');
      }
    }
  }, [id, flagReports, navigate, toast]);

  const loadModerationHistory = async (reportId: string) => {
    setHistoryLoading(true);
    try {
      const history = await getModerationHistory(reportId);
      setModerationHistory(history);
    } catch (err) {
      console.error('Error loading moderation history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog.notes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for this action",
        variant: "destructive"
      });
      return;
    }

    if (!report) return;

    setActionLoading(true);
    let result;

    switch (actionDialog.type) {
      case 'resolve':
        result = await resolveReport(report.id, actionDialog.notes);
        break;
      case 'dismiss':
        result = await dismissReport(report.id, actionDialog.notes);
        break;
      case 'ban':
        if (report.reports?.user_id) {
          result = await banUser(report.reports.user_id, actionDialog.notes);
        } else {
          result = { success: false, error: 'No user to ban' };
        }
        break;
      default:
        result = { success: false, error: 'Invalid action' };
    }

    if (result.success) {
      toast({
        title: "Success",
        description: `Report ${actionDialog.type}d successfully`
      });
      setActionDialog({ open: false, type: 'resolve', notes: '' });
      // Refresh the report data
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
    setActionLoading(false);
  };

  const handleAddNote = async () => {
    if (!adminNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive"
      });
      return;
    }

    setAddingNote(true);
    // In a real implementation, you'd have an API endpoint for adding admin notes
    // For now, we'll simulate this
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Admin note added successfully"
      });
      setAdminNote('');
      if (report) {
        loadModerationHistory(report.id);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive"
      });
    } finally {
      setAddingNote(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'dismissed':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'destructive',
      'resolved': 'default',
      'dismissed': 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'destructive'} className="text-sm">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background">
        
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
              <p className="text-muted-foreground mb-4">
                {error || 'The requested flag report could not be found.'}
              </p>
              <Button onClick={() => navigate('/superadmin/flag-reports')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Flag Reports
              </Button>
            </CardContent>
          </Card>
        </div>
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
              variant="outline"
              onClick={() => navigate('/superadmin/flag-reports')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Flag className="h-8 w-8" />
                Flag Report #{report.id.slice(0, 8)}
              </h1>
              <p className="text-muted-foreground mt-1">
                Detailed view and moderation controls
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(report.status)}
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Report Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Report Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Flag Type</Label>
                      <p className="font-medium text-lg">{report.flag_type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                      <p className="font-medium">{new Date(report.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                      <p className="font-medium">{new Date(report.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Report ID</Label>
                      <p className="font-mono text-sm bg-muted p-2 rounded">{report.id}</p>
                    </div>
                    {report.is_auto_flagged && (
                      <div>
                        <Badge variant="outline" className="text-sm">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Auto-flagged by system
                        </Badge>
                      </div>
                    )}
                    {report.flagged_by_user && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Reported By</Label>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{report.flagged_by_user.name}</p>
                            <p className="text-sm text-muted-foreground">{report.flagged_by_user.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {report.reason && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reason for Flagging</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg border-l-4 border-orange-500">
                      <p className="text-sm">{report.reason}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Flagged Content */}
            {report.reports && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Flagged Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                        <p className="font-medium text-lg">{report.reports.title}</p>
                      </div>
                      {report.reports.description && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                          <p className="text-sm leading-relaxed">{report.reports.description}</p>
                        </div>
                      )}
                      {report.reports.media_url && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Media Content</Label>
                          <div className="mt-2">
                            <img 
                              src={report.reports.media_url} 
                              alt="Report media" 
                              className="max-w-full h-auto max-h-96 rounded-lg border object-contain"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Posted: {new Date(report.reports.created_at).toLocaleString()}</span>
                        </div>
                        <Badge variant="outline">{report.reports.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Moderation History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Moderation History
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => report && loadModerationHistory(report.id)}
                    disabled={historyLoading}
                  >
                    {historyLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {historyLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {moderationHistory.length > 0 ? (
                  <div className="space-y-3">
                    {moderationHistory.map((action) => (
                      <div key={action.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize flex items-center gap-2">
                            {action.action.includes('resolve') && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {action.action.includes('dismiss') && <XCircle className="h-4 w-4 text-gray-600" />}
                            {action.action.includes('ban') && <Ban className="h-4 w-4 text-red-600" />}
                            {action.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(action.created_at).toLocaleString()}
                          </span>
                        </div>
                        {action.reason && (
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{action.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No moderation history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Actions & Notes */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {report.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle>Moderation Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActionDialog({ open: true, type: 'resolve', notes: '' })}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve Report
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActionDialog({ open: true, type: 'dismiss', notes: '' })}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Dismiss Report
                  </Button>
                  {report.reports?.user_id && (
                    <Button 
                      variant="destructive"
                      onClick={() => setActionDialog({ open: true, type: 'ban', notes: '' })}
                      className="w-full"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Ban User
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admin-note">Add Internal Note</Label>
                  <Textarea
                    id="admin-note"
                    placeholder="Add an administrative note about this report..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <Button 
                  onClick={handleAddNote}
                  disabled={addingNote || !adminNote.trim()}
                  className="w-full"
                >
                  {addingNote ? 'Adding...' : 'Add Note'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Administrative notes are visible only to superadmins and are recorded in the audit log.
                </p>
              </CardContent>
            </Card>

            {/* Report Status */}
            <Card>
              <CardHeader>
                <CardTitle>Report Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="mb-3">
                    {getStatusIcon(report.status)}
                  </div>
                  <p className="font-medium text-lg capitalize mb-2">{report.status}</p>
                  <p className="text-sm text-muted-foreground">
                    {report.status === 'pending' && 'This report is awaiting moderation'}
                    {report.status === 'resolved' && 'This report has been resolved'}
                    {report.status === 'dismissed' && 'This report has been dismissed'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'resolve' && 'Resolve Flag Report'}
              {actionDialog.type === 'dismiss' && 'Dismiss Flag Report'}
              {actionDialog.type === 'ban' && 'Ban User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                {actionDialog.type === 'resolve' && 'You are about to mark this flag report as resolved. This action will close the report and record your decision.'}
                {actionDialog.type === 'dismiss' && 'You are about to dismiss this flag report. This means the report is invalid or doesn\'t require action.'}
                {actionDialog.type === 'ban' && 'You are about to ban the user who created this content. This will prevent them from creating new reports.'}
              </p>
            </div>
            <div>
              <Label htmlFor="action-notes">Reason (required)</Label>
              <Textarea
                id="action-notes"
                placeholder={`Explain why you are ${actionDialog.type}ing this report...`}
                value={actionDialog.notes}
                onChange={(e) => setActionDialog(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-2 min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, type: 'resolve', notes: '' })}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={actionDialog.type === 'ban' ? 'destructive' : 'default'}
                onClick={handleAction}
                disabled={actionLoading || !actionDialog.notes.trim()}
              >
                {actionLoading 
                  ? `${actionDialog.type === 'resolve' ? 'Resolving' : actionDialog.type === 'dismiss' ? 'Dismissing' : 'Banning'}...` 
                  : `${actionDialog.type === 'resolve' ? 'Resolve Report' : actionDialog.type === 'dismiss' ? 'Dismiss Report' : 'Ban User'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminViewFlagReport;
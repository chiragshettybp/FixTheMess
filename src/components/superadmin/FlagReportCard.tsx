import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Eye, Clock, CheckCircle, XCircle, Ban, Flag, User, FileText, Calendar } from 'lucide-react';
import { FlagReport, ModerationAction, useFlagReports } from '@/hooks/useFlagReports';
import { useToast } from '@/hooks/use-toast';

interface FlagReportCardProps {
  report: FlagReport;
  onViewDetails: (report: FlagReport) => void;
}

const FlagReportCard = ({ report, onViewDetails }: FlagReportCardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'destructive',
      'resolved': 'default',
      'dismissed': 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'destructive'}>
        <div className="flex items-center gap-1">
          {getStatusIcon(status)}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewDetails(report)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">
            Flag Report #{report.id.slice(0, 8)}
          </CardTitle>
          {getStatusBadge(report.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{report.flag_type}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(report.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {report.reports && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{report.reports.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {report.reports.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {report.flagged_by_user && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Reported by {report.flagged_by_user.name}</span>
          </div>
        )}

        {report.is_auto_flagged && (
          <Badge variant="outline" className="w-fit">
            Auto-flagged
          </Badge>
        )}

        <Button variant="outline" size="sm" className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

interface FlagReportDetailModalProps {
  report: FlagReport | null;
  open: boolean;
  onClose: () => void;
}

export const FlagReportDetailModal = ({ report, open, onClose }: FlagReportDetailModalProps) => {
  const { resolveReport, dismissReport, banUser, getModerationHistory } = useFlagReports();
  const { toast } = useToast();
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
  const [moderationHistory, setModerationHistory] = useState<ModerationAction[]>([]);

  if (!report) return null;

  const handleAction = async () => {
    if (!actionDialog.notes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for this action",
        variant: "destructive"
      });
      return;
    }

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
      onClose();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
    setActionLoading(false);
  };

  const loadModerationHistory = async () => {
    const history = await getModerationHistory(report.id);
    setModerationHistory(history);
  };

  const handleViewHistory = () => {
    loadModerationHistory();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Flag Report Details - #{report.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Report Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={report.status === 'pending' ? 'destructive' : 'default'}>
                      <div className="flex items-center gap-1">
                        {report.status === 'resolved' && <CheckCircle className="h-4 w-4" />}
                        {report.status === 'dismissed' && <XCircle className="h-4 w-4" />}
                        {report.status === 'pending' && <Clock className="h-4 w-4" />}
                        <span className="capitalize">{report.status}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Flag Type</Label>
                  <p className="font-medium">{report.flag_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="font-medium">{new Date(report.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Report ID</Label>
                  <p className="font-mono text-sm">{report.id}</p>
                </div>
                {report.is_auto_flagged && (
                  <div>
                    <Badge variant="outline">Auto-flagged by system</Badge>
                  </div>
                )}
                {report.flagged_by_user && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reported By</Label>
                    <p className="font-medium">{report.flagged_by_user.name}</p>
                    <p className="text-sm text-muted-foreground">{report.flagged_by_user.email}</p>
                  </div>
                )}
              </div>
            </div>

            {report.reason && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Reason</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg">{report.reason}</p>
              </div>
            )}

            <Separator />

            {/* Original Content */}
            {report.reports && (
              <div>
                <Label className="text-lg font-semibold">Flagged Content</Label>
                <div className="mt-3 border rounded-lg p-4 space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                    <p className="font-medium">{report.reports.title}</p>
                  </div>
                  {report.reports.description && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p className="text-sm">{report.reports.description}</p>
                    </div>
                  )}
                  {report.reports.media_url && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Media</Label>
                      <div className="mt-2">
                        <img 
                          src={report.reports.media_url} 
                          alt="Report media" 
                          className="max-w-xs rounded-lg border"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Posted: {new Date(report.reports.created_at).toLocaleString()}</span>
                    <Badge variant="outline">{report.reports.status}</Badge>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            {report.status === 'pending' && (
              <div>
                <Label className="text-lg font-semibold">Moderation Actions</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button 
                    onClick={() => setActionDialog({ open: true, type: 'resolve', notes: '' })}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve Report
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActionDialog({ open: true, type: 'dismiss', notes: '' })}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Dismiss Report
                  </Button>
                  {report.reports?.user_id && (
                    <Button 
                      variant="destructive"
                      onClick={() => setActionDialog({ open: true, type: 'ban', notes: '' })}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Ban User
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Moderation History */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Moderation History</Label>
                <Button variant="outline" size="sm" onClick={handleViewHistory}>
                  Load History
                </Button>
              </div>
              {moderationHistory.length > 0 && (
                <div className="mt-3 space-y-2">
                  {moderationHistory.map((action) => (
                    <div key={action.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{action.action.replace('_', ' ')}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(action.created_at).toLocaleString()}
                        </span>
                      </div>
                      {action.reason && (
                        <p className="text-sm text-muted-foreground mt-1">{action.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {actionDialog.type === 'resolve' && 'You are about to mark this flag report as resolved.'}
                {actionDialog.type === 'dismiss' && 'You are about to dismiss this flag report.'}
                {actionDialog.type === 'ban' && 'You are about to ban the user who created this content.'}
              </p>
            </div>
            <div>
              <Label htmlFor="action-notes">Reason (required)</Label>
              <Textarea
                id="action-notes"
                placeholder={`Explain why you are ${actionDialog.type}ing this report...`}
                value={actionDialog.notes}
                onChange={(e) => setActionDialog(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1"
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
                  : `${actionDialog.type === 'resolve' ? 'Resolve' : actionDialog.type === 'dismiss' ? 'Dismiss' : 'Ban User'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlagReportCard;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Upload, Image, Calendar } from 'lucide-react';
import { ReportDetail, ReportMedia } from '@/hooks/useSuperadminReportDetail';
import { Link } from 'react-router-dom';

interface ReportResolutionPanelProps {
  report: ReportDetail;
  resolutionMedia: ReportMedia[];
  onMarkResolved: () => void;
}

export const ReportResolutionPanel = ({ 
  report, 
  resolutionMedia, 
  onMarkResolved 
}: ReportResolutionPanelProps) => {
  const isResolved = report.status === 'resolved';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isResolved ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Clock className="w-5 h-5 text-orange-500" />
            )}
            Resolution Status
          </CardTitle>
          {!isResolved && (
            <Button size="sm" onClick={onMarkResolved}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Resolved
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <h4 className="font-medium">Current Status</h4>
            <p className="text-sm text-muted-foreground">
              {isResolved ? 'This issue has been resolved' : 'This issue is pending resolution'}
            </p>
          </div>
          <Badge variant={isResolved ? 'default' : 'secondary'}>
            {isResolved ? 'Resolved' : 'Pending'}
          </Badge>
        </div>

        {/* Resolution Timeline */}
        {isResolved && (
          <div className="space-y-3">
            <h4 className="font-medium">Resolution Details</h4>
            
            {report.resolved_at && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Resolved on:</span>
                <span>{new Date(report.resolved_at).toLocaleString()}</span>
              </div>
            )}

            {report.resolved_by && (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Resolved by:</span>
                <span>Government Official</span>
              </div>
            )}
          </div>
        )}

        {/* Before/After Media Gallery */}
        {(report.media_url || resolutionMedia.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-medium">Before & After</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before */}
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Before (Original Report)</h5>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={report.media_url}
                    alt="Before - Original issue"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Reported: {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* After */}
              {resolutionMedia.length > 0 ? (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">After (Resolution Proof)</h5>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={resolutionMedia[0].url}
                      alt="After - Resolution proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resolved: {new Date(resolutionMedia[0].created_at).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">After (Resolution Proof)</h5>
                  <div className="aspect-video bg-muted rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {isResolved ? 'No resolution proof uploaded' : 'Upload proof when resolved'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resolution Actions */}
        {!isResolved ? (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium">Resolution Actions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/gov-resolve/${report.id}`}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resolution Proof
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={onMarkResolved}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Resolved
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>This issue has been successfully resolved</span>
            </div>
          </div>
        )}

        {/* Government Status Note */}
        {report.status && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            <strong>Government Status:</strong> {report.status}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
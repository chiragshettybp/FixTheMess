import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Edit, Calendar, Tag, FileText } from 'lucide-react';
import { ReportDetail } from '@/hooks/useSuperadminReportDetail';

interface ReportDetailsCardProps {
  report: ReportDetail;
  onUpdateNSFW: (nsfw: boolean) => void;
}

export const ReportDetailsCard = ({ report, onUpdateNSFW }: ReportDetailsCardProps) => {
  const [isNSFW, setIsNSFW] = useState(report.nsfw || false);

  const handleNSFWToggle = (checked: boolean) => {
    setIsNSFW(checked);
    onUpdateNSFW(checked);
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'pothole': return 'Pothole';
      case 'streetlight': return 'Street Light';
      case 'garbage': return 'Garbage/Waste';
      case 'drainage': return 'Drainage';
      case 'road_damage': return 'Road Damage';
      case 'traffic_signal': return 'Traffic Signal';
      case 'other': return 'Other';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Report Details
          </CardTitle>
          <Button size="sm" variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Title</Label>
          <h3 className="text-lg font-semibold mt-1">{report.title}</h3>
        </div>

        {/* Description */}
        {report.description && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
            <p className="mt-1 text-foreground leading-relaxed">{report.description}</p>
          </div>
        )}

        {/* Issue Type */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Category</Label>
          <div className="mt-1">
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <Tag className="w-3 h-3" />
              {getIssueTypeLabel(report.issue_type)}
            </Badge>
          </div>
        </div>

        {/* Status and Severity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <div className="mt-1">
              <Badge variant={
                report.status === 'approved' ? 'default' :
                report.status === 'rejected' ? 'destructive' :
                report.status === 'resolved' ? 'secondary' :
                'secondary'
              }>
                {report.status}
              </Badge>
            </div>
          </div>
          
          {report.severity && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Severity</Label>
              <div className="mt-1">
                <Badge variant={
                  report.severity === 'urgent' || report.severity === 'high' ? 'destructive' :
                  report.severity === 'medium' ? 'default' :
                  'secondary'
                }>
                  {report.severity}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Created
            </span>
            <span>{new Date(report.created_at).toLocaleString()}</span>
          </div>
          
          {report.updated_at !== report.created_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Last Updated
              </span>
              <span>{new Date(report.updated_at).toLocaleString()}</span>
            </div>
          )}

          {report.resolved_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Resolved
              </span>
              <span>{new Date(report.resolved_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Reporter Type */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Reporter</Label>
          <div className="mt-1">
            <Badge variant={report.is_anonymous ? 'outline' : 'default'}>
              {report.is_anonymous ? 'Anonymous' : 'Registered User'}
            </Badge>
          </div>
        </div>

        {/* NSFW Toggle (Admin Only) */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="nsfw-toggle" className="text-sm font-medium">
              Mark as NSFW
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Content not suitable for work or public display
            </p>
          </div>
          <Switch
            id="nsfw-toggle"
            checked={isNSFW}
            onCheckedChange={handleNSFWToggle}
          />
        </div>

        {/* Device/Timezone Info */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <div className="grid grid-cols-2 gap-2">
            <span>ID: {report.id.slice(0, 8)}...</span>
            <span>Region: {report.region_id ? 'Assigned' : 'Unassigned'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
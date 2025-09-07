import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Flag, 
  User, 
  FileText, 
  Calendar, 
  AlertTriangle,
  Ban,
  MessageSquare
} from 'lucide-react';
import { FlagReport } from '@/hooks/useFlagReports';

interface EnhancedFlagReportCardProps {
  report: FlagReport;
  onViewDetails: (report: FlagReport) => void;
  onSelect?: (reportId: string, selected: boolean) => void;
  isSelected?: boolean;
  showActions?: boolean;
  onQuickResolve?: (reportId: string) => void;
  onQuickDismiss?: (reportId: string) => void;
}

export const EnhancedFlagReportCard = ({ 
  report, 
  onViewDetails, 
  onSelect,
  isSelected = false,
  showActions = false,
  onQuickResolve,
  onQuickDismiss
}: EnhancedFlagReportCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

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
      <Badge variant={variants[status as keyof typeof variants] || 'destructive'} className="text-xs">
        <div className="flex items-center gap-1">
          {getStatusIcon(status)}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
  };

  const getPriorityLevel = (flagType: string) => {
    const highPriority = ['harassment', 'misinformation', 'spam'];
    const mediumPriority = ['inappropriate', 'duplicate'];
    
    if (highPriority.includes(flagType)) return 'high';
    if (mediumPriority.includes(flagType)) return 'medium';
    return 'low';
  };

  const priorityLevel = getPriorityLevel(report.flag_type);
  const priorityColors = {
    high: 'border-l-red-500 bg-red-50/50',
    medium: 'border-l-orange-500 bg-orange-50/50', 
    low: 'border-l-blue-500 bg-blue-50/50'
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 border-l-4 ${priorityColors[priorityLevel]} ${
        isHovered ? 'shadow-lg scale-[1.02]' : 'hover:shadow-md'
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Don't trigger if clicking on interactive elements
        if (e.target instanceof HTMLElement && 
            (e.target.closest('button') || e.target.closest('[role="checkbox"]'))) {
          return;
        }
        onViewDetails(report);
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(report.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flag className="h-4 w-4" />
                #{report.id.slice(0, 8)}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Priority: <span className={`font-medium ${
                  priorityLevel === 'high' ? 'text-red-600' :
                  priorityLevel === 'medium' ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {priorityLevel.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
          {getStatusBadge(report.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Flag Type and Date */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium capitalize">{report.flag_type.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(report.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Reporter Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {report.flagged_by_user ? `By ${report.flagged_by_user.name}` : 'Auto-flagged'}
          </span>
          {report.is_auto_flagged && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              AUTO
            </Badge>
          )}
        </div>

        {/* Flagged Content Preview */}
        {report.reports && (
          <div className="bg-muted/30 p-3 rounded-lg border">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{report.reports.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {report.reports.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.reports.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {report.reports.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reason (if provided) */}
        {report.reason && (
          <div className="text-sm">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Reason:</p>
                <p className="text-xs bg-muted p-2 rounded italic line-clamp-2">
                  "{report.reason}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(report);
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
          
          {showActions && report.status === 'pending' && (
            <>
              <Button
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickResolve?.(report.id);
                }}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Resolve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickDismiss?.(report.id);
                }}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            </>
          )}
        </div>

        {/* Time Indicators */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Created {new Date(report.created_at).toLocaleDateString()}</span>
          <span>Updated {new Date(report.updated_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};
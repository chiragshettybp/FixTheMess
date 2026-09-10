import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User, Eye, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Report } from '@/hooks/useGovernmentReports';

interface ReportCardProps {
  report: Report;
  onViewDetails: (report: Report) => void;
}

export const ReportCard = ({ report, onViewDetails }: ReportCardProps) => {
  const navigate = useNavigate();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'New';
      case 'urgent': return 'Urgent';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1">
            {report.title}
          </h3>
          <Badge className={getStatusColor(report.status)}>
            {getStatusLabel(report.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Description */}
        {report.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {truncateText(report.description)}
          </p>
        )}

        {/* Category */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {report.issue_type}
          </Badge>
        </div>

        {/* Meta information */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>
              {report.is_anonymous ? 'Anonymous Citizen' : 'Registered Citizen'}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(report.created_at)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>
              {report.latitude?.toFixed(4) ?? 'N/A'}, {report.longitude?.toFixed(4) ?? 'N/A'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onViewDetails(report)}
          >
            <Eye className="h-3 w-3 mr-2" />
            View Details
          </Button>
          
          {report.status !== 'resolved' && (
            <Button 
              variant="default" 
              size="sm" 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => navigate(`/gov-resolve/${report.id}`)}
            >
              <CheckCircle className="h-3 w-3 mr-2" />
              Mark as Resolved
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
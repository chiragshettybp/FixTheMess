import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Flag, 
  UserCheck, 
  Eye,
  EyeOff,
  Star,
  Pin
} from 'lucide-react';
import { TimelineEvent } from '@/hooks/useSuperadminReportDetail';

interface ReportTimelineProps {
  timeline: TimelineEvent[];
  onAddNote?: (note: string) => void;
}

export const ReportTimeline = ({ timeline, onAddNote }: ReportTimelineProps) => {
  const [noteText, setNoteText] = useState('');

  const handleAddNote = () => {
    if (noteText.trim() && onAddNote) {
      onAddNote(noteText.trim());
      setNoteText('');
    }
  };
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'flagged':
        return <Flag className="w-4 h-4 text-orange-500" />;
      case 'assigned':
        return <UserCheck className="w-4 h-4 text-purple-500" />;
      case 'hidden':
        return <EyeOff className="w-4 h-4 text-gray-500" />;
      case 'unhidden':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'featured':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'pinned':
        return <Pin className="w-4 h-4 text-indigo-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'blue';
      case 'approved':
      case 'resolved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'flagged':
        return 'orange';
      case 'assigned':
        return 'purple';
      case 'hidden':
        return 'gray';
      case 'unhidden':
        return 'blue';
      case 'featured':
        return 'yellow';
      case 'pinned':
        return 'indigo';
      default:
        return 'gray';
    }
  };

  const formatAction = (action: string) => {
    switch (action) {
      case 'created':
        return 'Report Created';
      case 'approved':
        return 'Report Approved';
      case 'rejected':
        return 'Report Rejected';
      case 'resolved':
        return 'Report Resolved';
      case 'flagged':
        return 'Report Flagged';
      case 'assigned':
        return 'Assigned to City Admin';
      case 'hidden':
        return 'Report Hidden';
      case 'unhidden':
        return 'Report Unhidden';
      case 'featured':
        return 'Report Featured';
      case 'pinned':
        return 'Report Pinned';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No timeline events available
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-muted">
                    {getActionIcon(event.action)}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-px h-8 bg-muted mt-2" />
                  )}
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{formatAction(event.action)}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        getActionColor(event.action) === 'green' ? 'border-green-200 text-green-700' :
                        getActionColor(event.action) === 'red' ? 'border-red-200 text-red-700' :
                        getActionColor(event.action) === 'blue' ? 'border-blue-200 text-blue-700' :
                        getActionColor(event.action) === 'orange' ? 'border-orange-200 text-orange-700' :
                        getActionColor(event.action) === 'purple' ? 'border-purple-200 text-purple-700' :
                        getActionColor(event.action) === 'yellow' ? 'border-yellow-200 text-yellow-700' :
                        getActionColor(event.action) === 'indigo' ? 'border-indigo-200 text-indigo-700' :
                        'border-muted text-muted-foreground'
                      }`}
                    >
                      {event.action}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {event.details}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>by {event.actor_name}</span>
                    <span>•</span>
                    <span>{new Date(event.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Timeline Event (for admins) */}
        {onAddNote && (
          <div className="pt-4 border-t mt-6">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Add admin note to timeline..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
              </div>
              <Button 
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                size="sm"
              >
                Add Note
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
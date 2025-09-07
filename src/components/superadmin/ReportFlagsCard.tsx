import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Flag, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Calendar,
  User
} from 'lucide-react';
import { ReportFlag } from '@/hooks/useSuperadminReportDetail';

interface ReportFlagsCardProps {
  flags: ReportFlag[];
  onResolveFlag: (flagId: string) => void;
  onAddNote: (note: string) => void;
}

export const ReportFlagsCard = ({ 
  flags, 
  onResolveFlag, 
  onAddNote 
}: ReportFlagsCardProps) => {
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
      setIsAddingNote(false);
    }
  };

  const getFlagTypeColor = (type: string) => {
    switch (type) {
      case 'spam':
        return 'destructive';
      case 'inappropriate':
        return 'destructive';
      case 'misinformation':
        return 'destructive';
      case 'harassment':
        return 'destructive';
      case 'duplicate':
        return 'secondary';
      case 'low_quality':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getFlagTypeLabel = (type: string) => {
    switch (type) {
      case 'spam':
        return 'Spam';
      case 'inappropriate':
        return 'Inappropriate Content';
      case 'misinformation':
        return 'Misinformation';
      case 'harassment':
        return 'Harassment';
      case 'duplicate':
        return 'Duplicate Report';
      case 'low_quality':
        return 'Low Quality';
      default:
        return type;
    }
  };

  const openFlags = flags.filter(flag => flag.status === 'pending');
  const resolvedFlags = flags.filter(flag => flag.status === 'resolved');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Flags & Moderation
          </CardTitle>
          <Badge variant={openFlags.length > 0 ? 'destructive' : 'secondary'}>
            {openFlags.length} Open
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Open Flags */}
        {openFlags.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-destructive">Open Flags</h4>
            {openFlags.map((flag) => (
              <div key={flag.id} className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={getFlagTypeColor(flag.flag_type)}>
                    {getFlagTypeLabel(flag.flag_type)}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onResolveFlag(flag.id)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolve
                  </Button>
                </div>
                
                {flag.reason && (
                  <p className="text-sm mb-2">{flag.reason}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {flag.flagged_by_user_id ? 'User Report' : 'Auto-flagged'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(flag.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Flag className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No open flags</p>
          </div>
        )}

        {/* Resolved Flags Summary */}
        {resolvedFlags.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-muted-foreground">
                Resolved Flags
              </h5>
              <Badge variant="secondary">{resolvedFlags.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resolvedFlags.length} flag{resolvedFlags.length !== 1 ? 's' : ''} previously resolved
            </p>
          </div>
        )}

        {/* Add Admin Note */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Admin Notes</Label>
            {!isAddingNote && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsAddingNote(true)}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Add Note
              </Button>
            )}
          </div>

          {isAddingNote && (
            <div className="space-y-2">
              <Textarea
                placeholder="Add an administrative note about this report..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNote}>
                  Add Note
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!isAddingNote && (
            <p className="text-xs text-muted-foreground">
              Administrative notes will be recorded in the audit log
            </p>
          )}
        </div>

        {/* Quick Moderation Actions */}
        <div className="pt-3 border-t">
          <h5 className="text-sm font-medium mb-2">Quick Actions</h5>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Mark NSFW
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Flag className="w-3 h-3 mr-1" />
              Add Flag
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
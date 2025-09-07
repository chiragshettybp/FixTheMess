import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, User, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  is_read: boolean;
  created_at: string;
  sent_by: string | null;
  delivery_status: string;
}

interface NotificationDetailModalProps {
  notification: Notification;
  isOpen: boolean;
  onClose: () => void;
  onUpdateReadStatus: (id: string, isRead: boolean) => void;
  isGovernment?: boolean;
}

export const NotificationDetailModal = ({
  notification,
  isOpen,
  onClose,
  onUpdateReadStatus,
  isGovernment = false
}: NotificationDetailModalProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold mb-3">
                {notification.title}
              </DialogTitle>
              
              <div className="flex items-center gap-2 mb-4">
                <Badge 
                  variant="outline" 
                  className={`${getPriorityColor(notification.priority)} flex items-center gap-1`}
                >
                  {getPriorityIcon(notification.priority)}
                  {notification.priority.toUpperCase()}
                </Badge>
                
                {!notification.is_read && (
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    UNREAD
                  </Badge>
                )}
                
                {isGovernment && (
                  <Badge variant="outline" className="bg-secondary/10 text-secondary">
                    OFFICIAL
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateReadStatus(notification.id, !notification.is_read)}
              className="ml-4"
            >
              {notification.is_read ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Mark Unread
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Mark Read
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {/* Notification Content */}
        <div className="space-y-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {notification.body}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Metadata */}
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">Sender:</span>
            <span>{notification.sent_by || 'System'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Sent:</span>
            <span>{format(new Date(notification.created_at), 'PPpp')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Status:</span>
            <span className="capitalize">{notification.delivery_status}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
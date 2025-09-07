import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationDetailModal } from './NotificationDetailModal';
import { formatDistanceToNow } from 'date-fns';
import { Eye, EyeOff, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface NotificationListProps {
  notifications: Notification[];
  onUpdateReadStatus: (id: string, isRead: boolean) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  isGovernment?: boolean;
}

export const NotificationList = ({
  notifications,
  onUpdateReadStatus,
  onLoadMore,
  hasMore,
  loading,
  isGovernment = false
}: NotificationListProps) => {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

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
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      onUpdateReadStatus(notification.id, true);
    }
  };

  if (notifications.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h3>
        <p className="text-muted-foreground">
          You'll see important messages and updates here when they arrive.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg border ${
            !notification.is_read 
              ? 'bg-primary/5 border-primary/20' 
              : 'bg-card border-border'
          }`}
          onClick={() => handleNotificationClick(notification)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {getPriorityIcon(notification.priority)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={getPriorityColor(notification.priority)}
                  >
                    {notification.priority.toUpperCase()}
                  </Badge>
                  {!notification.is_read && (
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      NEW
                    </Badge>
                  )}
                  {isGovernment && (
                    <Badge variant="outline" className="bg-secondary/10 text-secondary">
                      OFFICIAL
                    </Badge>
                  )}
                </div>
                
                <h3 className={`font-semibold text-base mb-2 line-clamp-1 ${
                  !notification.is_read ? 'text-foreground' : 'text-foreground/80'
                }`}>
                  {notification.title}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {notification.body}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    From: FixTheMess (President)
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              <div className="ml-4 flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateReadStatus(notification.id, !notification.is_read);
                      }}
                    >
                      {notification.is_read ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Mark as unread
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Mark as read
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Skeleton className="h-8 w-8 ml-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center pt-4">
          <Button onClick={onLoadMore} variant="outline" className="w-full">
            Load More Notifications
          </Button>
        </div>
      )}

      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onUpdateReadStatus={onUpdateReadStatus}
          isGovernment={isGovernment}
        />
      )}
    </div>
  );
};
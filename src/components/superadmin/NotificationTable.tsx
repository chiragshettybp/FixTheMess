import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RefreshCw, Eye, Calendar, User, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SuperadminNotification } from '@/pages/SuperadminNotifications';

interface NotificationTableProps {
  notifications: SuperadminNotification[];
  loading: boolean;
  hasMore: boolean;
  sending: boolean;
  onLoadMore: () => void;
  onDelete: (id: string) => void;
  onResend: (notification: SuperadminNotification) => void;
}

export const NotificationTable = ({
  notifications,
  loading,
  hasMore,
  sending,
  onLoadMore,
  onDelete,
  onResend
}: NotificationTableProps) => {
  const [selectedNotification, setSelectedNotification] = useState<SuperadminNotification | null>(null);

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'scheduled': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '🟡';
    }
  };

  const getRecipientTypeDisplay = (notification: SuperadminNotification) => {
    if (notification.recipient_role) {
      return `${notification.recipient_role} users`;
    }
    return 'All users';
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  if (loading && notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notifications ({notifications.length})</span>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
              <p className="text-sm">Send your first notification to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {truncateText(notification.title, 40)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {truncateText(notification.body, 60)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            {getRecipientTypeDisplay(notification)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(notification.priority)}>
                            {getPriorityIcon(notification.priority)} {notification.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(notification.delivery_status)}>
                            {notification.delivery_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedNotification(notification)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {(notification.delivery_status === 'failed' || notification.delivery_status === 'pending') && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={sending}
                                onClick={() => onResend(notification)}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this notification? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(notification.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {notifications.map((notification) => (
                  <Card key={notification.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {truncateText(notification.body, 80)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getPriorityBadgeVariant(notification.priority)} className="text-xs">
                          {getPriorityIcon(notification.priority)} {notification.priority}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(notification.delivery_status)} className="text-xs">
                          {notification.delivery_status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getRecipientTypeDisplay(notification)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {(notification.delivery_status === 'failed' || notification.delivery_status === 'pending') && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={sending}
                              onClick={() => onResend(notification)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this notification? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(notification.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={onLoadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <AlertDialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {getPriorityIcon(selectedNotification.priority)} {selectedNotification.title}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Message:</h4>
                <p className="text-sm">{selectedNotification.body}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Priority:</span>
                  <Badge variant={getPriorityBadgeVariant(selectedNotification.priority)} className="ml-2">
                    {selectedNotification.priority}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant={getStatusBadgeVariant(selectedNotification.delivery_status)} className="ml-2">
                    {selectedNotification.delivery_status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Recipients:</span>
                  <span className="ml-2">{getRecipientTypeDisplay(selectedNotification)}</span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <span className="ml-2">{new Date(selectedNotification.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
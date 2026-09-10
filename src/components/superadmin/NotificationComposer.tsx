import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Send, Users, UserCheck, Shield, User } from 'lucide-react';
import type { SuperadminNotification } from '@/pages/SuperadminNotifications';

interface NotificationComposerProps {
  onNotificationSent: (notification: SuperadminNotification) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const NotificationComposer = ({ onNotificationSent }: NotificationComposerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [recipientType, setRecipientType] = useState<'all' | 'role' | 'specific'>('all');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users when recipient type changes
  useEffect(() => {
    if (recipientType === 'specific' || recipientType === 'role') {
      fetchUsers();
    }
  }, [recipientType, selectedRole]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      let query = supabase.from('users').select('id, name, email, role');
      
      if (recipientType === 'role' && selectedRole) {
        query = query.eq('role', selectedRole as any);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      setUsers((data || []) as User[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const getRecipientUserIds = async (): Promise<string[]> => {
    if (recipientType === 'all') {
      // Get all user IDs
      const { data, error } = await supabase
        .from('users')
        .select('id');
      
      if (error) throw error;
      return (data || []).map(u => u.id);
    } else if (recipientType === 'role') {
      // Get users by role
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', selectedRole as any);
      
      if (error) throw error;
      return (data || []).map(u => u.id);
    } else {
      // Specific users
      return selectedUsers;
    }
  };

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and message are required',
        variant: 'destructive'
      });
      return;
    }

    if (recipientType === 'role' && !selectedRole) {
      toast({
        title: 'Validation Error',
        description: 'Please select a role',
        variant: 'destructive'
      });
      return;
    }

    if (recipientType === 'specific' && selectedUsers.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one user',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const recipientUserIds = await getRecipientUserIds();
      
      // Create notifications for each recipient
      const notifications = recipientUserIds.map(userId => ({
        user_id: userId,
        title: title.trim(),
        body: message.trim(),
        priority,
        recipient_role: recipientType === 'role' ? selectedRole : null,
        sent_by: user?.id,
        delivery_status: 'sent' as const,
        is_read: false
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;

      // Clear form
      setTitle('');
      setMessage('');
      setPriority('medium');
      setRecipientType('all');
      setSelectedRole('');
      setSelectedUsers([]);

      // Notify parent component with the first notification
      if (data && data.length > 0) {
        onNotificationSent(data[0] as SuperadminNotification);
      }

      toast({
        title: 'Success',
        description: `Notification sent to ${recipientUserIds.length} users`,
      });

    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getPriorityIcon = () => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '🟡';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Compose Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-2 block">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title..."
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {title.length}/100 characters
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium mb-2 block">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message..."
            rows={4}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {message.length}/500 characters
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🔴 High Priority</SelectItem>
              <SelectItem value="medium">🟡 Medium Priority</SelectItem>
              <SelectItem value="low">🔵 Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipient Type */}
        <div>
          <label className="text-sm font-medium mb-2 block">Recipients</label>
          <Select value={recipientType} onValueChange={(value: 'all' | 'role' | 'specific') => setRecipientType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All Users
                </div>
              </SelectItem>
              <SelectItem value="role">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  By Role
                </div>
              </SelectItem>
              <SelectItem value="specific">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Specific Users
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role Selection */}
        {recipientType === 'role' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Select Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Regular Users</SelectItem>
                <SelectItem value="government">Government Officials</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="superadmin">Super Administrators</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* User Selection */}
        {recipientType === 'specific' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Select Users</label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
              {loadingUsers ? (
                <div className="text-sm text-muted-foreground">Loading users...</div>
              ) : users.length > 0 ? (
                users.map(user => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                    <label htmlFor={user.id} className="text-sm flex-1 cursor-pointer">
                      {user.name} ({user.email})
                      <Badge variant="outline" className="ml-2 text-xs">
                        {user.role}
                      </Badge>
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No users found</div>
              )}
            </div>
            {selectedUsers.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {selectedUsers.length} user(s) selected
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {(title || message) && (
          <div className="border rounded-md p-3 bg-muted/50">
            <div className="text-xs font-medium text-muted-foreground mb-2">Preview:</div>
            <div className="space-y-1">
              <div className="font-medium text-sm flex items-center gap-2">
                {getPriorityIcon()} {title || 'Notification Title'}
              </div>
              <div className="text-sm text-muted-foreground">
                {message || 'Notification message...'}
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button 
          onClick={sendNotification} 
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full"
          size="lg"
        >
          {sending ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
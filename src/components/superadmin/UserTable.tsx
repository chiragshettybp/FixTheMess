import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Ban, UserCheck, AlertTriangle, Phone, Mail } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserWithStats } from '@/hooks/useAllUsers';
import { formatDistanceToNow } from 'date-fns';

interface UserTableProps {
  users: UserWithStats[];
  loading: boolean;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onBanUser?: (userId: string) => void;
  onUnbanUser?: (userId: string) => void;
}

export const UserTable = ({
  users,
  loading,
  currentPage,
  totalCount,
  itemsPerPage,
  onBanUser,
  onUnbanUser
}: UserTableProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (user: UserWithStats) => {
    // Check role first - if banned role, show banned regardless of status
    if (user.role === 'banned') {
      return <Badge variant="destructive">Banned</Badge>;
    }
    
    // Check status field for banned status
    if (user.status === 'banned') {
      return <Badge variant="destructive">Banned</Badge>;
    }
    
    switch (user.status) {
      case 'suspended':
        return <Badge variant="destructive" className="bg-orange-600">Suspended</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>;
      case 'active':
      default:
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge variant="secondary" className="bg-purple-600">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="secondary" className="bg-blue-600">Admin</Badge>;
      case 'government':
        return <Badge variant="secondary" className="bg-indigo-600">Government</Badge>;
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const getLastSeenText = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Users ({totalCount})</span>
          <span className="text-sm font-normal text-muted-foreground">
            Page {currentPage} • Showing {users.length} of {totalCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">No users match your current search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">User</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Reports</TableHead>
                  <TableHead className="hidden xl:table-cell">Strikes</TableHead>
                  <TableHead className="hidden xl:table-cell">Last Seen</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow 
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/superadmin/view-user/${user.id}`)}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium truncate max-w-[160px]">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.username ? `@${user.username}` : user.email}
                        </div>
                        {user.is_anonymous && (
                          <Badge variant="outline" className="text-xs">Anonymous</Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(user)}
                      {user.suspension_until && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Until {new Date(user.suspension_until).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="hidden lg:table-cell">
                      {getRoleBadge(user.role)}
                    </TableCell>
                    
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {user.report_count}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="hidden xl:table-cell">
                      {user.strike_count > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {user.strike_count}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {getLastSeenText(user.last_seen_at)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/superadmin/view-user/${user.id}`)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/superadmin/edit-user/${user.id}`)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.role === 'banned' ? (
                          onUnbanUser && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onUnbanUser(user.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )
                        ) : (
                          onBanUser && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onBanUser(user.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
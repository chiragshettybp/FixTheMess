import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Crown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'superadmin':
        return <Crown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'secondary';
      case 'superadmin':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {profile?.name || 'User'}
        </p>
      </div>

        {/* User Profile Card */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground">{profile?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant(profile?.role || '')}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(profile?.role || '')}
                      {profile?.role?.toUpperCase()}
                    </div>
                  </Badge>
                  {profile?.is_anonymous && (
                    <Badge variant="outline">Anonymous</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/report')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Report New Issue
              </Button>
              <Button className="w-full justify-start" variant="outline">
                View My Reports
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Community Issues
              </Button>
            </CardContent>
          </Card>

          {/* Role-specific Features */}
          {profile?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Tools
                </CardTitle>
                <CardDescription>
                  Government official features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  Manage Reports
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Issue Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Generate Reports
                </Button>
              </CardContent>
            </Card>
          )}

          {profile?.role === 'superadmin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Super Admin
                </CardTitle>
                <CardDescription>
                  Platform management tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  User Management
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  System Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Platform Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest interactions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity to display.</p>
              <p className="text-sm mt-1">Start by reporting your first civic issue!</p>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

export default Dashboard;
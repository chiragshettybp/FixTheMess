import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Search, 
  Bell, 
  Users, 
  FileText, 
  AlertTriangle, 
  Shield, 
  Flag,
  Settings,
  Activity,
  Upload,
  TrendingUp,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface SuperAdminPageHeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  alertsCount?: number;
}

const SuperAdminPageHeader = ({ 
  title = "SuperAdmin", 
  subtitle = "FixTheMess Platform",
  onRefresh,
  refreshing = false,
  alertsCount = 0
}: SuperAdminPageHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const quickActions = [
    {
      title: 'Send Notification',
      description: 'Broadcast to users',
      icon: Bell,
      href: '/superadmin/notifications'
    },
    {
      title: 'View Reports',
      description: 'Manage reports',
      icon: FileText,
      href: '/superadmin/reports'
    },
    {
      title: 'User Management',
      description: 'Manage users',
      icon: Users,
      href: '/superadmin/users'
    },
    {
      title: 'System Health',
      description: 'Monitor platform',
      icon: Activity,
      href: '/superadmin/system-health'
    },
    {
      title: 'Flagged Reports',
      description: 'Review flags',
      icon: Flag,
      href: '/superadmin/flag-reports'
    },
    {
      title: 'Analytics',
      description: 'View insights',
      icon: BarChart3,
      href: '/superadmin/app-analytics'
    },
    {
      title: 'Settings',
      description: 'System config',
      icon: Settings,
      href: '/superadmin/settings'
    }
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Navigation</h2>
                <div className="space-y-2">
                  {quickActions.map((action, index) => (
                    <Link
                      key={index}
                      to={action.href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <action.icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:ml-2 sm:inline">Refresh</span>
            </Button>
          )}

          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              {alertsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {alertsCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminPageHeader;
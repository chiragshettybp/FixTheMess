import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Plus, 
  Map, 
  FileText, 
  User, 
  Shield,
  Crown 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  // Don't show bottom nav on auth pages
  if (location.pathname === '/auth') {
    return null;
  }

  if (loading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <div className="h-6 w-6 rounded bg-muted animate-pulse" />
              <div className="h-3 w-8 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/home',
      show: true,
    },
    {
      label: 'Report',
      icon: Plus,
      path: '/report',
      show: true,
      highlight: true, // Special styling for report button
    },
    {
      label: 'Map',
      icon: Map,
      path: '/map',
      show: true,
    },
    {
      label: 'Feed',
      icon: FileText,
      path: '/feed',
      show: true,
    },
    {
      label: 'Reports',
      icon: User,
      path: '/my-reports',
      show: true,
    },
    // Admin-only items
    {
      label: 'Admin',
      icon: Shield,
      path: '/admin',
      show: profile?.role === 'admin',
    },
    {
      label: 'Super',
      icon: Crown,
      path: '/superadmin',
      show: profile?.role === 'superadmin',
    },
  ].filter(item => item.show);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:h-0" />
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800 md:hidden">
        <div className="flex items-center py-2 px-4 max-w-md mx-auto">
          {navItems.map((item) => {
            const isCurrentActive = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 flex flex-col items-center space-y-1 h-auto py-2 px-2 rounded-lg transition-all duration-200",
                  isCurrentActive 
                    ? "text-white bg-white/10" 
                    : "text-gray-400 hover:text-white",
                  item.highlight && "text-white"
                )}
                onClick={() => handleNavigation(item.path)}
                aria-label={`Navigate to ${item.label}`}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      "h-5 w-5 transition-transform",
                      item.highlight && "h-6 w-6",
                      isCurrentActive && "scale-110"
                    )} 
                  />
                  {item.highlight && !isCurrentActive && (
                    <div className="absolute -inset-1 rounded-full bg-primary/20 animate-pulse" />
                  )}
                  {(item.path === '/admin' || item.path === '/superadmin') && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    >
                      {item.icon === Shield ? 'A' : 'S'}
                    </Badge>
                  )}
                </div>
                <span 
                  className={cn(
                    "text-xs font-medium transition-all",
                    isCurrentActive ? "text-white" : "text-gray-400",
                    item.highlight && "text-white font-semibold"
                  )}
                >
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </nav>

    </>
  );
};
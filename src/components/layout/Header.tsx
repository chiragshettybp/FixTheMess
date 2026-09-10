import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Settings, User, Shield, Crown, Menu, Home, Plus, Map, FileText, Bell } from 'lucide-react';
import logo from '@/assets/logo.png';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
export const Header = () => {
  const {
    user,
    profile,
    signOut,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleSignOut = async () => {
    const {
      error
    } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
      navigate('/auth');
    }
  };
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'superadmin':
        return <Crown className="h-3 w-3" />;
      default:
        return null;
    }
  };
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'secondary' as const;
      case 'superadmin':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };
  const getDisplayName = () => {
    if (profile?.is_anonymous) return 'Anonymous User';
    return profile?.name || 'User';
  };
  const getUserInitials = () => {
    if (profile?.is_anonymous) return 'AU';
    const name = profile?.name || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  if (loading) {
    return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
      </header>;
  }
  return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="FTM Logo" className="h-5 w-auto object-contain" />
          <span className="hidden font-bold sm:inline-block">FixTheMess</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {[
            { label: 'Home', path: '/', icon: 'Home' },
            { label: 'Report', path: '/report', icon: 'Plus', highlight: true },
            { label: 'Map', path: '/map', icon: 'Map' },
            { label: 'Feed', path: '/feed', icon: 'FileText' },
            { label: 'Reports', path: '/my-reports', icon: 'User' },
            ...(profile?.role === 'admin' || profile?.role === 'superadmin' ? [{ label: 'Admin', path: '/admin', icon: 'Shield' }] : []),
            ...(profile?.role === 'superadmin' ? [{ label: 'Super', path: '/superadmin', icon: 'Crown' }] : []),
          ].map((item) => {
            const isCurrentActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const IconComponent = item.icon === 'Home' ? Home : 
                                 item.icon === 'Plus' ? Plus : 
                                 item.icon === 'Map' ? Map : 
                                 item.icon === 'FileText' ? FileText : 
                                 item.icon === 'User' ? User : 
                                 item.icon === 'Shield' ? Shield : Crown;
            
            return (
              <Button
                key={item.path}
                variant={isCurrentActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "px-3 py-2",
                  item.highlight && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
                onClick={() => navigate(item.path)}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {getDisplayName()}
          </span>
          
          {/* Notifications Bell */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/user-notifications')}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={getDisplayName()} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {(profile?.role === 'admin' || profile?.role === 'superadmin') && <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    {getRoleIcon(profile.role)}
                  </div>}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {profile?.role && <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(profile.role)}
                          {profile.role.toUpperCase()}
                        </div>
                      </Badge>}
                    {profile?.is_anonymous && <Badge variant="outline" className="text-xs">Anonymous</Badge>}
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate('/')}>
                <User className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center space-x-2">
          {/* Mobile Notifications Bell */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/user-notifications')}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={getDisplayName()} />
                    <AvatarFallback className="text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{getDisplayName()}</p>
                      {(profile?.role === 'admin' || profile?.role === 'superadmin') && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          {getRoleIcon(profile.role)}
                        </div>}
                    </div>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    <div className="flex items-center gap-2">
                      {profile?.role && <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs">
                          {profile.role.toUpperCase()}
                        </Badge>}
                      {profile?.is_anonymous && <Badge variant="outline" className="text-xs">Anonymous</Badge>}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => {
                  navigate('/');
                  setIsMenuOpen(false);
                }}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start" onClick={() => {
                  navigate('/profile');
                  setIsMenuOpen(false);
                }}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>;
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  AlertTriangle, 
  Ban, 
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { Reporter } from '@/hooks/useSuperadminReportDetail';
import { Link } from 'react-router-dom';

interface ReporterCardProps {
  reporter: Reporter | null;
  onWarn: () => void;
  onAddStrike: () => void;
  onBan: () => void;
  onUnban: () => void;
}

export const ReporterCard = ({ 
  reporter, 
  onWarn, 
  onAddStrike, 
  onBan, 
  onUnban 
}: ReporterCardProps) => {
  if (!reporter) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Reporter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Anonymous Report</p>
            <p className="text-xs text-muted-foreground mt-1">
              No user information available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isBanned = reporter.role === 'banned';
  const strikeCount = reporter.strike_count || 0;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'government':
        return 'secondary';
      case 'banned':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStrikeColor = (count: number) => {
    if (count === 0) return 'secondary';
    if (count < 3) return 'default';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Reporter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Profile */}
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reporter.email}`} />
            <AvatarFallback>
              {reporter.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{reporter.name}</h4>
            <p className="text-sm text-muted-foreground truncate">{reporter.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getRoleColor(reporter.role)}>
                {reporter.role}
              </Badge>
              {strikeCount > 0 && (
                <Badge variant={getStrikeColor(strikeCount)}>
                  {strikeCount} Strike{strikeCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Joined</p>
              <p className="font-medium">
                {new Date(reporter.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">
                {isBanned ? 'Banned' : 'Active'}
              </p>
            </div>
          </div>
        </div>

        {/* User Enforcement Actions */}
        <div className="space-y-2 pt-2 border-t">
          <h5 className="font-medium">Moderation Actions</h5>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onWarn}
              className="text-xs"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Warn User
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onAddStrike}
              className="text-xs"
            >
              <Shield className="w-3 h-3 mr-1" />
              Add Strike
            </Button>
          </div>
          
          <Button 
            size="sm" 
            variant={isBanned ? "default" : "destructive"}
            onClick={isBanned ? onUnban : onBan}
            className="w-full text-xs"
          >
            {isBanned ? (
              <>
                <UserCheck className="w-3 h-3 mr-1" />
                Unban User
              </>
            ) : (
              <>
                <Ban className="w-3 h-3 mr-1" />
                Ban User
              </>
            )}
          </Button>
        </div>

        {/* Quick Links */}
        <div className="space-y-2 pt-2 border-t">
          <h5 className="font-medium">Quick Links</h5>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
              <Link to={`/reports?user=${reporter.id}`}>
                <ExternalLink className="w-3 h-3 mr-1" />
                User Reports
              </Link>
            </Button>
          </div>
        </div>

        {/* Strike History */}
        {strikeCount > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Strike History</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This user has {strikeCount} strike{strikeCount !== 1 ? 's' : ''} for policy violations
            </p>
          </div>
        )}

        {/* Banned Status */}
        {isBanned && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">User Banned</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This user has been banned from the platform
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
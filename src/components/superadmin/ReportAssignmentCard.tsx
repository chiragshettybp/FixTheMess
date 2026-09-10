import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  Mail,
  Calendar,
  MapPin
} from 'lucide-react';
import { ReportDetail } from '@/hooks/useSuperadminReportDetail';

interface ReportAssignmentCardProps {
  report: ReportDetail;
  cityAdmins: any[];
  onAssign: (adminId: string) => void;
  onNotifyAssignee?: () => void;
  onEscalate?: () => void;
}

export const ReportAssignmentCard = ({ 
  report, 
  cityAdmins, 
  onAssign,
  onNotifyAssignee,
  onEscalate
}: ReportAssignmentCardProps) => {
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Calculate SLA status (mock implementation)
  const calculateSLA = () => {
    const created = new Date(report.created_at);
    const now = new Date();
    const hoursElapsed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    // SLA thresholds (in hours)
    const urgentSLA = 4;
    const normalSLA = 24;
    
    const threshold = report.severity === 'urgent' ? urgentSLA : normalSLA;
    const isOverdue = hoursElapsed > threshold;
    const progress = Math.min((hoursElapsed / threshold) * 100, 100);
    
    return {
      hoursElapsed,
      threshold,
      isOverdue,
      progress,
      status: isOverdue ? 'overdue' : hoursElapsed > threshold * 0.8 ? 'warning' : 'good'
    };
  };

  const sla = calculateSLA();
  const currentAssignee = cityAdmins.find(admin => admin.id === report.resolved_by);

  const handleAssign = () => {
    if (selectedAdmin) {
      onAssign(selectedAdmin);
      setIsAssigning(false);
      setSelectedAdmin('');
    }
  };

  const getSLAColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted border-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Assignment */}
        <div>
          <Label className="text-sm font-medium">Current Assignee</Label>
          <div className="mt-2">
            {currentAssignee ? (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{currentAssignee.admin_name}</h4>
                  <Badge variant="default">Assigned</Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    {currentAssignee.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {currentAssignee.assigned_city}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 border-2 border-dashed border-muted rounded-lg text-center">
                <UserCheck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No assignee</p>
              </div>
            )}
          </div>
        </div>

        {/* SLA Indicator */}
        <div>
          <Label className="text-sm font-medium">SLA Status</Label>
          <div className={`mt-2 p-3 rounded-lg border ${getSLAColor(sla.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {sla.isOverdue ? 'Overdue' : 'On Track'}
              </span>
              <span className="text-xs">
                {sla.hoursElapsed}h / {sla.threshold}h
              </span>
            </div>
            
            <div className="w-full bg-background rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  sla.status === 'good' ? 'bg-green-500' :
                  sla.status === 'warning' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(sla.progress, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-xs">
              <Clock className="w-3 h-3" />
              <span>
                {sla.isOverdue 
                  ? `${sla.hoursElapsed - sla.threshold}h overdue`
                  : `${sla.threshold - sla.hoursElapsed}h remaining`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Assignment Actions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Reassign Report</Label>
          
          {!isAssigning ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAssigning(true)}
              className="w-full"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              {currentAssignee ? 'Reassign to Different Admin' : 'Assign to City Admin'}
            </Button>
          ) : (
            <div className="space-y-2">
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city admin..." />
                </SelectTrigger>
                <SelectContent>
                  {cityAdmins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      <div className="flex flex-col items-start">
                        <span>{admin.admin_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {admin.assigned_city}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAssign} disabled={!selectedAdmin}>
                  Assign
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setIsAssigning(false);
                    setSelectedAdmin('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Options */}
        <div className="pt-3 border-t">
          <Label className="text-sm font-medium mb-2 block">Notification Options</Label>
          <div className="space-y-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start text-xs"
              onClick={onNotifyAssignee}
              disabled={!onNotifyAssignee || !currentAssignee}
            >
              <Mail className="w-3 h-3 mr-2" />
              Notify Assignee
            </Button>
            
            {sla.isOverdue && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full justify-start text-xs text-red-600"
                onClick={onEscalate}
                disabled={!onEscalate}
              >
                <AlertTriangle className="w-3 h-3 mr-2" />
                Send Escalation Notice
              </Button>
            )}
          </div>
        </div>

        {/* Assignment History */}
        <div className="pt-3 border-t">
          <Label className="text-sm font-medium">Assignment History</Label>
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
            </div>
            {currentAssignee && (
              <div className="flex items-center gap-2 mt-1">
                <UserCheck className="w-3 h-3" />
                <span>Assigned to {currentAssignee.admin_name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
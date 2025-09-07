import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface BulkModerationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  action: 'resolve' | 'dismiss' | null;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

export const BulkModerationDialog = ({
  open,
  onClose,
  selectedCount,
  action,
  onConfirm,
  loading
}: BulkModerationDialogProps) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
  };

  const getActionConfig = () => {
    switch (action) {
      case 'resolve':
        return {
          title: 'Resolve Flag Reports',
          description: 'You are about to mark the selected flag reports as resolved.',
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          buttonText: 'Resolve Reports',
          buttonClass: 'bg-green-600 hover:bg-green-700'
        };
      case 'dismiss':
        return {
          title: 'Dismiss Flag Reports',
          description: 'You are about to dismiss the selected flag reports.',
          icon: <XCircle className="h-6 w-6 text-gray-600" />,
          buttonText: 'Dismiss Reports',
          buttonClass: 'bg-gray-600 hover:bg-gray-700'
        };
      default:
        return {
          title: 'Bulk Action',
          description: 'Please select an action.',
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          buttonText: 'Continue',
          buttonClass: ''
        };
    }
  };

  const config = getActionConfig();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {config.icon}
            <DialogTitle>{config.title}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {selectedCount} report{selectedCount !== 1 ? 's' : ''} selected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>

          <div>
            <Label htmlFor="bulk-reason">Reason (required)</Label>
            <Textarea
              id="bulk-reason"
              placeholder={`Explain why you are ${action}ing these reports...`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This reason will be recorded for all selected reports.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className={config.buttonClass}
              onClick={handleSubmit}
              disabled={loading || !reason.trim()}
            >
              {loading ? 'Processing...' : config.buttonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
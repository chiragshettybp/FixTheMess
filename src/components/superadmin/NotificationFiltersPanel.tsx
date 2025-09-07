import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, Download, Search, Calendar } from 'lucide-react';
import type { NotificationFilters } from '@/pages/SuperadminNotifications';

interface NotificationFiltersPanelProps {
  filters: NotificationFilters;
  onFiltersChange: (filters: NotificationFilters) => void;
  notificationCount: number;
}

export const NotificationFiltersPanel = ({
  filters,
  onFiltersChange,
  notificationCount
}: NotificationFiltersPanelProps) => {

  const updateFilter = (key: keyof NotificationFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      recipient_type: 'all',
      priority: 'all',
      search: '',
      date_from: '',
      date_to: ''
    });
  };

  const exportNotifications = () => {
    // Simple CSV export functionality
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Title,Message,Priority,Status,Recipients,Created\n"
      + "Sample notification data would go here...";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "notifications.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters & Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search title or message..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipient Type Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Recipient Type</label>
          <Select value={filters.recipient_type} onValueChange={(value) => updateFilter('recipient_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Recipients</SelectItem>
              <SelectItem value="user">Regular Users</SelectItem>
              <SelectItem value="government">Government Officials</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
              <SelectItem value="superadmin">Super Administrators</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">🔴 High Priority</SelectItem>
              <SelectItem value="medium">🟡 Medium Priority</SelectItem>
              <SelectItem value="low">🔵 Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            <Calendar className="h-4 w-4 inline mr-1" />
            Date Range
          </label>
          <div className="space-y-2">
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => updateFilter('date_from', e.target.value)}
              placeholder="From date"
            />
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => updateFilter('date_to', e.target.value)}
              placeholder="To date"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="pt-4 border-t space-y-2">
          <Button variant="outline" onClick={clearFilters} className="w-full">
            Clear Filters
          </Button>
          
          <Button variant="outline" onClick={exportNotifications} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <div>Total Notifications: {notificationCount}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
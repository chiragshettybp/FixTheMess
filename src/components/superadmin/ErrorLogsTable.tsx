import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar as CalendarIcon,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Eye,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ErrorLog, SystemHealthFilters } from '@/hooks/useSystemHealth';

interface ErrorLogsTableProps {
  errorLogs: ErrorLog[];
  loading: boolean;
  filters: SystemHealthFilters;
  onUpdateFilters: (filters: Partial<SystemHealthFilters>) => void;
  onClearFilters: () => void;
  onUpdateStatus: (errorId: string, status: 'acknowledged' | 'resolved') => void;
  onExport: () => void;
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
    case 'low': return <Info className="h-4 w-4 text-blue-500" />;
    default: return <Info className="h-4 w-4" />;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical': return <Badge variant="destructive">Critical</Badge>;
    case 'high': return <Badge variant="outline" className="border-orange-500 text-orange-600">High</Badge>;
    case 'medium': return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium</Badge>;
    case 'low': return <Badge variant="outline" className="border-blue-500 text-blue-600">Low</Badge>;
    default: return <Badge variant="outline">{severity}</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open': return <Badge variant="outline" className="border-red-500 text-red-600">Open</Badge>;
    case 'acknowledged': return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Acknowledged</Badge>;
    case 'resolved': return <Badge variant="outline" className="border-green-500 text-green-600">Resolved</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const getComponentBadge = (component: string) => {
  const colors = {
    frontend: 'border-blue-500 text-blue-600',
    backend: 'border-green-500 text-green-600',
    api: 'border-purple-500 text-purple-600',
    database: 'border-red-500 text-red-600'
  };
  
  return (
    <Badge variant="outline" className={colors[component as keyof typeof colors] || ''}>
      {component}
    </Badge>
  );
};

export const ErrorLogsTable = ({
  errorLogs,
  loading,
  filters,
  onUpdateFilters,
  onClearFilters,
  onUpdateStatus,
  onExport
}: ErrorLogsTableProps) => {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const hasActiveFilters = 
    filters.severity !== 'all' ||
    filters.component !== 'all' ||
    filters.status !== 'all' ||
    filters.search.trim() !== '' ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Logs
            </CardTitle>
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col space-y-4">
            {/* Search and Quick Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search error type or message..."
                  value={filters.search}
                  onChange={(e) => onUpdateFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filters.severity} onValueChange={(value) => onUpdateFilters({ severity: value })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.component} onValueChange={(value) => onUpdateFilters({ component: value })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Components</SelectItem>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="backend">Backend</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.status} onValueChange={(value) => onUpdateFilters({ status: value })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Date Range Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex gap-2">
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-40 justify-start text-left font-normal",
                        !filters.dateRange.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.start ? (
                        format(filters.dateRange.start, "PPP")
                      ) : (
                        <span>Start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start || undefined}
                      onSelect={(date) => {
                        onUpdateFilters({ dateRange: { ...filters.dateRange, start: date || null } });
                        setStartDateOpen(false);
                      }}
                      disabled={(date) =>
                        date > new Date() || 
                        (filters.dateRange.end && date > filters.dateRange.end)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-40 justify-start text-left font-normal",
                        !filters.dateRange.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.end ? (
                        format(filters.dateRange.end, "PPP")
                      ) : (
                        <span>End date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end || undefined}
                      onSelect={(date) => {
                        onUpdateFilters({ dateRange: { ...filters.dateRange, end: date || null } });
                        setEndDateOpen(false);
                      }}
                      disabled={(date) =>
                        date > new Date() || 
                        (filters.dateRange.start && date < filters.dateRange.start)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Error Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No error logs found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  errorLogs.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(error.timestamp), "MMM dd, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(error.severity)}
                          {getSeverityBadge(error.severity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getComponentBadge(error.component)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {error.error_type}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={error.message}>
                          {error.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(error.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {error.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateStatus(error.id, 'acknowledged')}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ack
                            </Button>
                          )}
                          {error.status !== 'resolved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateStatus(error.id, 'resolved')}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
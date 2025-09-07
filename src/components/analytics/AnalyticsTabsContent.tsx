import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Activity, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface AnalyticsTabsContentProps {
  reportsData: any[];
  usersData: any[];
  engagementData: any[];
  loading: boolean;
}

export const AnalyticsTabsContent = ({ 
  reportsData, 
  usersData, 
  engagementData, 
  loading 
}: AnalyticsTabsContentProps) => {
  const COLORS = [
    'hsl(var(--primary))', 
    'hsl(var(--secondary))', 
    'hsl(var(--accent))', 
    'hsl(var(--destructive))',
    'hsl(var(--warning))',
    'hsl(var(--success))'
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="reports" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="reports" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Reports
        </TabsTrigger>
        <TabsTrigger value="users" className="gap-2">
          <Users className="h-4 w-4" />
          Users
        </TabsTrigger>
        <TabsTrigger value="engagement" className="gap-2">
          <Activity className="h-4 w-4" />
          Engagement
        </TabsTrigger>
        <TabsTrigger value="geographic" className="gap-2">
          <MapPin className="h-4 w-4" />
          Geographic
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reports" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: 45, color: 'hsl(var(--warning))' },
                      { name: 'In Progress', value: 30, color: 'hsl(var(--primary))' },
                      { name: 'Resolved', value: 80, color: 'hsl(var(--success))' },
                      { name: 'Rejected', value: 12, color: 'hsl(var(--destructive))' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Pending', value: 45, color: 'hsl(var(--warning))' },
                      { name: 'In Progress', value: 30, color: 'hsl(var(--primary))' },
                      { name: 'Resolved', value: 80, color: 'hsl(var(--success))' },
                      { name: 'Rejected', value: 12, color: 'hsl(var(--destructive))' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Reports Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Reports Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Issue Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Most Reported Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { type: 'Infrastructure', count: 45 },
                  { type: 'Public Safety', count: 38 },
                  { type: 'Environment', count: 32 },
                  { type: 'Traffic', count: 28 },
                  { type: 'Utilities', count: 22 },
                  { type: 'Other', count: 18 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="type" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Response Time Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Average Response Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Infrastructure', time: '2.4 hours', trend: 'up' },
                  { type: 'Public Safety', time: '45 minutes', trend: 'down' },
                  { type: 'Environment', time: '3.2 hours', trend: 'up' },
                  { type: 'Traffic', time: '1.8 hours', trend: 'down' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">{item.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.time}</span>
                      <Badge variant={item.trend === 'up' ? 'destructive' : 'default'}>
                        <TrendingUp className={`h-3 w-3 ${item.trend === 'down' ? 'rotate-180' : ''}`} />
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usersData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="newUsers" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="New Users"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activeUsers" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="Active Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Demographics */}
          <Card>
            <CardHeader>
              <CardTitle>User Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Citizens', value: 820, color: 'hsl(var(--primary))' },
                      { name: 'Government', value: 45, color: 'hsl(var(--secondary))' },
                      { name: 'Anonymous', value: 234, color: 'hsl(var(--accent))' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Citizens', value: 820, color: 'hsl(var(--primary))' },
                      { name: 'Government', value: 45, color: 'hsl(var(--secondary))' },
                      { name: 'Anonymous', value: 234, color: 'hsl(var(--accent))' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Reporters */}
          <Card>
            <CardHeader>
              <CardTitle>Most Active Reporters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'John Doe', reports: 23, badge: 'Gold' },
                  { name: 'Sarah Wilson', reports: 18, badge: 'Silver' },
                  { name: 'Mike Chen', reports: 15, badge: 'Bronze' },
                  { name: 'Emily Davis', reports: 12, badge: 'Active' },
                  { name: 'Alex Johnson', reports: 10, badge: 'Active' }
                ].map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{user.reports} reports</span>
                      <Badge variant={user.badge === 'Gold' ? 'default' : 'secondary'}>
                        {user.badge}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Activity by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { hour: '00:00', activity: 12 },
                  { hour: '06:00', activity: 25 },
                  { hour: '09:00', activity: 85 },
                  { hour: '12:00', activity: 95 },
                  { hour: '15:00', activity: 78 },
                  { hour: '18:00', activity: 120 },
                  { hour: '21:00', activity: 67 },
                  { hour: '23:00', activity: 34 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="activity" 
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="engagement" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Engagement Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Page Views"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="taps" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="User Taps"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="shares" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Shares"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Device Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Mobile', value: 68, color: 'hsl(var(--primary))' },
                      { name: 'Desktop', value: 28, color: 'hsl(var(--secondary))' },
                      { name: 'Tablet', value: 4, color: 'hsl(var(--accent))' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Mobile', value: 68, color: 'hsl(var(--primary))' },
                      { name: 'Desktop', value: 28, color: 'hsl(var(--secondary))' },
                      { name: 'Tablet', value: 4, color: 'hsl(var(--accent))' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Session Duration */}
          <Card>
            <CardHeader>
              <CardTitle>Session Duration Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { duration: '0-1m', sessions: 45 },
                  { duration: '1-5m', sessions: 120 },
                  { duration: '5-15m', sessions: 85 },
                  { duration: '15-30m', sessions: 35 },
                  { duration: '30m+', sessions: 18 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="duration" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="sessions" 
                    fill="hsl(var(--accent))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Feature Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Most Used Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { feature: 'Submit Report', usage: 892, growth: '+12%' },
                  { feature: 'View Map', usage: 743, growth: '+8%' },
                  { feature: 'Search Reports', usage: 567, growth: '+15%' },
                  { feature: 'Share Report', usage: 334, growth: '+5%' },
                  { feature: 'User Profile', usage: 289, growth: '+3%' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">{item.feature}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.usage} uses</span>
                      <Badge variant="default" className="text-green-600 bg-green-100">
                        {item.growth}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="geographic" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Regional Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Reports by Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { region: 'Downtown', reports: 156 },
                  { region: 'Suburbs', reports: 98 },
                  { region: 'Industrial', reports: 67 },
                  { region: 'Residential', reports: 134 },
                  { region: 'Commercial', reports: 89 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="region" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="reports" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hot Zones */}
          <Card>
            <CardHeader>
              <CardTitle>High Activity Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { zone: 'City Center Plaza', reports: 45, urgency: 'High' },
                  { zone: 'Main Street Bridge', reports: 38, urgency: 'Medium' },
                  { zone: 'Tech District', reports: 32, urgency: 'Low' },
                  { zone: 'University Area', reports: 28, urgency: 'Medium' },
                  { zone: 'Shopping Complex', reports: 25, urgency: 'High' }
                ].map((zone, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <span className="font-medium">{zone.zone}</span>
                      <div className="text-sm text-muted-foreground">{zone.reports} reports</div>
                    </div>
                    <Badge variant={
                      zone.urgency === 'High' ? 'destructive' : 
                      zone.urgency === 'Medium' ? 'default' : 'secondary'
                    }>
                      {zone.urgency}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Response Coverage */}
          <Card>
            <CardHeader>
              <CardTitle>Response Coverage by Area</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { area: 'Zone A', covered: 95, pending: 5 },
                  { area: 'Zone B', covered: 87, pending: 13 },
                  { area: 'Zone C', covered: 92, pending: 8 },
                  { area: 'Zone D', covered: 78, pending: 22 },
                  { area: 'Zone E', covered: 89, pending: 11 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="area" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="covered"
                    stackId="1"
                    stroke="hsl(var(--success))"
                    fill="hsl(var(--success))"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stackId="1"
                    stroke="hsl(var(--warning))"
                    fill="hsl(var(--warning))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Geographic Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-sm text-muted-foreground">Active Zones</div>
                </div>
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="text-2xl font-bold text-orange-600">3</div>
                  <div className="text-sm text-muted-foreground">High Priority Areas</div>
                </div>
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <div className="text-2xl font-bold text-green-600">89%</div>
                  <div className="text-sm text-muted-foreground">Coverage Rate</div>
                </div>
                <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                  <div className="text-2xl font-bold text-purple-600">2.4h</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};
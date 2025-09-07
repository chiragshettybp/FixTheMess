import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ViewsData, TapsData } from '@/hooks/useAppAnalytics';

interface AnalyticsChartsProps {
  viewsData: ViewsData[];
  tapsData: TapsData[];
  loading: boolean;
}

export const AnalyticsCharts = ({ viewsData, tapsData, loading }: AnalyticsChartsProps) => {
  // Process views data for charts
  const viewsTimelineData = viewsData.reduce((acc: any[], view) => {
    const existingDate = acc.find(item => item.date === view.date);
    if (existingDate) {
      existingDate.views += view.views;
    } else {
      acc.push({
        date: view.date,
        views: view.views,
        formattedDate: new Date(view.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Process taps data for charts
  const tapsTimelineData = tapsData.reduce((acc: any[], tap) => {
    const existingDate = acc.find(item => item.date === tap.date);
    if (existingDate) {
      existingDate.taps += tap.taps;
    } else {
      acc.push({
        date: tap.date,
        taps: tap.taps,
        formattedDate: new Date(tap.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Device type breakdown for views
  const deviceViewsData = viewsData.reduce((acc: any[], view) => {
    const existing = acc.find(item => item.device === view.device_type);
    if (existing) {
      existing.views += view.views;
    } else {
      acc.push({
        device: view.device_type,
        views: view.views
      });
    }
    return acc;
  }, []);

  // Feature breakdown for taps
  const featureTapsData = tapsData.reduce((acc: any[], tap) => {
    const existing = acc.find(item => item.feature === tap.feature);
    if (existing) {
      existing.taps += tap.taps;
    } else {
      acc.push({
        feature: tap.feature,
        taps: tap.taps
      });
    }
    return acc;
  }, []).slice(0, 10); // Top 10 features

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Views Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={viewsTimelineData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="formattedDate" 
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
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Taps Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>User Interactions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tapsTimelineData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="formattedDate" 
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
              <Line 
                type="monotone" 
                dataKey="taps" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--secondary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Device Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Views by Device Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceViewsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ device, percent }) => `${device}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="views"
              >
                {deviceViewsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Features */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureTapsData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                type="category" 
                dataKey="feature" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
                width={80}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="taps" 
                fill="hsl(var(--accent))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
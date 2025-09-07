import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ThumbsUp, 
  Share2, 
  MessageSquare, 
  Eye, 
  TrendingUp,
  Heart,
  Users
} from 'lucide-react';
import { ReportDetail } from '@/hooks/useSuperadminReportDetail';

interface ReportEngagementCardProps {
  report: ReportDetail;
}

export const ReportEngagementCard = ({ report }: ReportEngagementCardProps) => {
  // Mock engagement data (in a real app, this would come from the database)
  const mockEngagementData = {
    votes: Math.floor(Math.random() * 50) + 5,
    shares: Math.floor(Math.random() * 20) + 2,
    comments: Math.floor(Math.random() * 30) + 1,
    views: Math.floor(Math.random() * 200) + 50,
    reactions: Math.floor(Math.random() * 15) + 3,
    bookmarks: Math.floor(Math.random() * 10) + 1
  };

  const engagementItems = [
    {
      icon: ThumbsUp,
      label: 'Votes',
      value: mockEngagementData.votes,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      description: 'Users who voted for this report'
    },
    {
      icon: Share2,
      label: 'Shares',
      value: mockEngagementData.shares,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      description: 'Times this report was shared'
    },
    {
      icon: MessageSquare,
      label: 'Comments',
      value: mockEngagementData.comments,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      description: 'User comments and discussions'
    },
    {
      icon: Eye,
      label: 'Views',
      value: mockEngagementData.views,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      description: 'Total report views'
    },
    {
      icon: Heart,
      label: 'Reactions',
      value: mockEngagementData.reactions,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      description: 'Emoji reactions'
    },
    {
      icon: Users,
      label: 'Bookmarks',
      value: mockEngagementData.bookmarks,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      description: 'Users who bookmarked this'
    }
  ];

  // Calculate engagement score (mock algorithm)
  const engagementScore = Math.floor(
    (mockEngagementData.votes * 2 + 
     mockEngagementData.shares * 3 + 
     mockEngagementData.comments * 1.5 + 
     mockEngagementData.views * 0.1) / 10
  );

  const getEngagementLevel = (score: number) => {
    if (score > 20) return { level: 'High', color: 'text-green-600', variant: 'default' as const };
    if (score > 10) return { level: 'Medium', color: 'text-orange-600', variant: 'secondary' as const };
    return { level: 'Low', color: 'text-red-600', variant: 'outline' as const };
  };

  const engagement = getEngagementLevel(engagementScore);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Engagement
          </CardTitle>
          <Badge variant={engagement.variant} className={engagement.color}>
            {engagement.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Engagement Score */}
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold mb-1">{engagementScore}</div>
          <p className="text-sm text-muted-foreground">Engagement Score</p>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {engagementItems.map((item) => (
            <div 
              key={item.label}
              className={`p-3 rounded-lg ${item.bgColor} border border-opacity-20`}
            >
              <div className="flex items-center gap-2 mb-1">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="text-lg font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Engagement Trends */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-medium mb-2">Engagement Trends</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Peak activity:</span>
              <span>2 hours ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Most shares:</span>
              <span>Social media</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Top demographics:</span>
              <span>18-35 years</span>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-medium mb-2">Performance Insights</h4>
          <div className="space-y-2">
            {mockEngagementData.votes > 20 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>High community support</span>
              </div>
            )}
            
            {mockEngagementData.shares > 10 && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Share2 className="w-3 h-3" />
                <span>Viral potential detected</span>
              </div>
            )}
            
            {mockEngagementData.comments > 15 && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <MessageSquare className="w-3 h-3" />
                <span>High discussion activity</span>
              </div>
            )}
            
            {engagementScore < 5 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-3 h-3" />
                <span>Consider featuring to boost visibility</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="pt-3 border-t bg-muted/30 -mx-6 -mb-6 p-3 rounded-b-lg">
          <div className="text-xs text-muted-foreground text-center">
            <strong>Total Interactions:</strong> {
              mockEngagementData.votes + 
              mockEngagementData.shares + 
              mockEngagementData.comments + 
              mockEngagementData.reactions +
              mockEngagementData.bookmarks
            } • <strong>Reach:</strong> {mockEngagementData.views} views
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
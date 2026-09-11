import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, ThumbsUp, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Reveal } from '@/lib/scroll-motion';

interface Report {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  latitude: number;
  longitude: number;
  status: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  issue_type: string;
  vote_count?: number;
}

export default function MyReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReports = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error",
          description: "Failed to load your reports",
          variant: "destructive"
        });
        return;
      }

      // Fetch vote counts for each report
      const reportsWithVotes = await Promise.all(
        (data || []).map(async (report) => {
          const { data: voteData } = await supabase.rpc('get_vote_count', { report_id: report.id });
          return {
            ...report,
            vote_count: voteData || 0
          } as Report;
        })
      );

      setReports(reportsWithVotes);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load your reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, [user]);

  const getLocationName = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500 hover:bg-green-600';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'in_progress':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">Loading your reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Reports</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your submitted community reports
          </p>
        </div>
        
        <Button onClick={() => navigate('/report')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
          <p className="text-muted-foreground mb-4">
            Start contributing to your community by reporting issues.
          </p>
          <Button onClick={() => navigate('/report')}>
            <Plus className="w-4 h-4 mr-2" />
            Submit Your First Report
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              You have submitted {reports.length} report{reports.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <Reveal key={report.id} delay={index * 50} className="h-full">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow h-full"
                onClick={() => navigate(`/report/${report.id}`)}
              >
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={report.media_url}
                    alt={report.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <Badge 
                    className={`absolute top-2 right-2 ${getStatusColor(report.status)}`}
                  >
                    {report.status === 'resolved' ? 'Resolved' : 
                     report.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{report.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {report.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {getLocationName(report.latitude, report.longitude)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground capitalize">
                      {report.issue_type.replace('_', ' ')}
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm">
                      <ThumbsUp className="w-4 h-4" />
                      {report.vote_count || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
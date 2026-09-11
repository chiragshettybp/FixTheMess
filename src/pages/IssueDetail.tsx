import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGuestId } from '@/hooks/useGuestId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Clock, ThumbsUp, Share2, CheckCircle, User, Calendar, Flag } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { toggleVote } from '@/lib/vote';


interface ReportDetail {
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
  user_id: string | null;
  issue_type: string;
  resolved_image_url: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  users?: {
    name: string;
  } | null;
  vote_count: number;
  user_has_voted: boolean;
}

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { getGuestId } = useGuestId();
  const { toast } = useToast();
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoords = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      // Using OpenStreetMap Nominatim service (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          return data.display_name;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    } finally {
      setLoadingAddress(false);
    }
  };

  const fetchReport = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching report:', error);
        toast({
          title: "Error",
          description: "Failed to load report details",
          variant: "destructive"
        });
        return;
      }

      // Fetch vote count and user vote status
      const { data: voteData } = await supabase.rpc('get_vote_count', { report_id: id });
      const currentUser = userRef.current;
      let userVoteData: boolean | null = null;
      if (currentUser) {
        const { data: voted } = await supabase.rpc('user_has_voted', { report_id: id, user_id: currentUser.id });
        userVoteData = voted || false;
      } else {
        const { data: guestVotedRows } = await supabase
          .from('votes')
          .select('id')
          .eq('report_id', id)
          .eq('anon_id', getGuestId())
          .limit(1);
        userVoteData = !!guestVotedRows && guestVotedRows.length > 0;
      }

      setReport({
        ...data,
        vote_count: voteData || 0,
        user_has_voted: userVoteData || false
      } as ReportDetail);

      // Get address from coordinates
      if (data.latitude && data.longitude) {
        const fetchedAddress = await getAddressFromCoords(data.latitude, data.longitude);
        setAddress(fetchedAddress);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: "Error",
        description: "Failed to load report details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id, user]);

  const [votedPulse, setVotedPulse] = useState(false);
  const [sendingVote, setSendingVote] = useState(false);

  const handleUpvote = async () => {
    if (!report || sendingVote) return;
    const currentUser = userRef.current;
    const current = report.user_has_voted;
    const target = !current;

    setSendingVote(true);
    // Optimistic update
    setVotedPulse(false);
    requestAnimationFrame(() => setVotedPulse(true));
    setReport({ ...report, user_has_voted: target, vote_count: (report.vote_count || 0) + (target ? 1 : -1) });

    try {
      const { error } = await toggleVote(report.id, current, currentUser, getGuestId);
      if (error) throw error;
      setVotedPulse(true);
      setTimeout(() => setVotedPulse(false), 600);
      // Refresh the report to update vote count
      fetchReport();
    } catch (error) {
      console.error('Error toggling vote:', error);
      setReport({ ...report, user_has_voted: current, vote_count: (report.vote_count || 0) + (target ? -1 : 1) });
      toast({
        title: "Error",
        description: "Failed to update vote",
        variant: "destructive"
      });
    } finally {
      setSendingVote(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!user || !report) return;

    // Check if user can mark as resolved (original reporter or admin)
    const canResolve = report.user_id === user.id || 
                      profile?.role === 'admin' || 
                      profile?.role === 'superadmin';

    if (!canResolve) {
      toast({
        title: "Permission denied",
        description: "Only the reporter or an admin can mark this as resolved",
        variant: "destructive"
      });
      return;
    }

    try {
      const newStatus = report.status === 'resolved' ? 'pending' : 'resolved';
      
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report marked as ${newStatus}`,
      });

      // Refresh the report
      fetchReport();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (platform?: 'twitter' | 'whatsapp' | 'copy') => {
    const url = window.location.href;
    const text = `Check out this community report: "${report?.title}"`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`);
        break;
      case 'copy':
      default:
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied",
            description: "Report link copied to clipboard",
          });
        } catch (error) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          toast({
            title: "Link copied",
            description: "Report link copied to clipboard",
          });
        }
        break;
    }
  };

  const getLocationDisplay = () => {
    if (!report) return '';
    
    if (loadingAddress) {
      return 'Getting address...';
    }
    
    if (address) {
      return address;
    }
    
    return `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
  };

  const canMarkResolved = report && user && (
    report.user_id === user.id || 
    profile?.role === 'admin' || 
    profile?.role === 'superadmin'
  );

  if (loading) {
    return (
        <div className="container mx-auto px-2 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">Loading report details...</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-2 py-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Report not found</h3>
          <p className="text-muted-foreground mb-4">The report you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/feed')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/feed')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Feed
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="border-0">
            <CardHeader className="px-3 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{report.title}</CardTitle>
                  <Badge 
                    className={`${
                      report.status === 'resolved' 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-yellow-500 hover:bg-yellow-600'
                    }`}
                  >
                    {report.status === 'resolved' ? 'Resolved' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 px-3">
              {/* Media */}
              <div className="w-full">
                <img
                  src={report.media_url}
                  alt={report.title}
                  className="w-full h-auto max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {report.description || 'No description provided.'}
                </p>
              </div>

              {/* Resolved By Authority Section */}
              {report.status === 'resolved' && report.resolved_image_url && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-600">Resolved By Authority</h3>
                  <div className="space-y-4">
                   <div className="w-full">
                     <img
                       src={report.resolved_image_url}
                       alt="Resolution proof"
                       className="w-full h-auto max-w-full object-contain rounded-lg border-2 border-green-200"
                       onError={(e) => {
                         e.currentTarget.src = '/placeholder.svg';
                       }}
                     />
                   </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="font-medium text-green-800">Resolution Status</div>
                            <div className="text-green-600">Issue Fixed</div>
                          </div>
                        </div>
                        
                        {report.resolved_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="font-medium text-green-800">Resolved Date</div>
                              <div className="text-green-600">
                                {format(new Date(report.resolved_at), 'PPpp')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <div>
                    <div>Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</div>
                    <div className="text-xs">{format(new Date(report.created_at), 'PPpp')}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <div className="flex-1">
                    <div>Location</div>
                    <div className="text-xs">
                      {loadingAddress ? (
                        'Getting address...'
                      ) : address ? (
                        <div className="space-y-1">
                          <div className="text-foreground font-medium">{address}</div>
                          <div className="text-muted-foreground">
                            {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                          </div>
                        </div>
                      ) : (
                        `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <div>
                    <div>Reported by</div>
                    <div className="text-xs">{report.is_anonymous ? 'Anonymous' : 'User'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <div>Issue Type</div>
                    <div className="text-xs capitalize">{report.issue_type.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="border-0">
            <CardHeader className="px-3 py-4">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-3">
              <Button
                onClick={handleUpvote}
                variant={report.user_has_voted ? "default" : "outline"}
                className={`w-full vote-btn ${votedPulse ? 'vote-pop' : ''} ${report.user_has_voted ? 'vote-active' : ''}`}
                disabled={sendingVote}
              >
                <ThumbsUp className={`w-4 h-4 mr-2 vote-thumb ${report.user_has_voted ? 'fill-current' : ''}`} />
                {report.user_has_voted ? 'Upvoted' : 'Upvote'} ({report.vote_count})
              </Button>
              
              {canMarkResolved && (
                <Button
                  onClick={handleMarkResolved}
                  variant={report.status === 'resolved' ? "outline" : "default"}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {report.status === 'resolved' ? 'Mark as Pending' : 'Mark as Resolved'}
                </Button>
              )}
              
              <Button
                onClick={() => navigate(`/report-abuse/${report.id}`)}
                variant="outline"
                className="w-full"
                disabled={!user}
              >
                <Flag className="w-4 h-4 mr-2" />
                Report Abuse
              </Button>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Share this report</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate(`/share/${report.id}`)}
                    variant="default"
                    size="sm"
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share to Authorities
                  </Button>
                  <Button
                    onClick={() => handleShare('copy')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleShare('twitter')}
                      variant="outline"
                      size="sm"
                    >
                      Twitter
                    </Button>
                    <Button
                      onClick={() => handleShare('whatsapp')}
                      variant="outline"
                      size="sm"
                    >
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-0">
            <CardHeader className="px-3 py-4">
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="px-3">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Votes</span>
                  <span className="font-medium">{report.vote_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium capitalize ${
                    report.status === 'resolved' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-xs">
                    {formatDistanceToNow(new Date(report.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
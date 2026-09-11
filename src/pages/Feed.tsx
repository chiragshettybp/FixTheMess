import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGuestId } from '@/hooks/useGuestId';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, ThumbsUp, Filter, Camera, X, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Reveal } from '@/lib/scroll-motion';
import { toggleVote } from '@/lib/vote';

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
  user_id: string | null;
  issue_type: string;
  users?: {
    name: string;
  } | null;
  vote_count?: number;
  user_has_voted?: boolean;
}

type SortOption = 'recent' | 'votes' | 'resolved';

export default function Feed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getGuestId } = useGuestId();
  const { toast } = useToast();
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showResolved, setShowResolved] = useState(false);
  
  // Camera preview states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Camera functions
  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = mediaStream;
      setIsCameraOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Camera access denied or not available. Please check your permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert canvas to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
    
    toast({
      title: 'Photo captured!',
      description: 'Your photo has been captured successfully.',
    });
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const proceedToReport = () => {
    if (capturedImage) {
      // Store the captured image in localStorage temporarily and navigate to report page
      sessionStorage.setItem('capturedReportImage', capturedImage);
      navigate('/report');
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);
  
  const fetchReports = async () => {
    try {
      let query = supabase
        .from('reports')
        .select('*');

      // Filter out hidden reports and banned users' reports
      query = query.neq('status', 'hidden');

      // Apply filters
      if (!showResolved) {
        query = query.neq('status', 'resolved');
      }

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'votes':
          // We'll sort by vote count after fetching
          break;
        case 'resolved':
          query = query.eq('status', 'resolved').order('updated_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error",
          description: "Failed to load reports",
          variant: "destructive"
        });
        return;
      }

      const reportIds = (data || []).map(r => r.id);

      // Batch-fetch vote counts
      const { data: voteCounts } = await supabase
        .from('votes')
        .select('report_id')
        .in('report_id', reportIds);

      const voteCountMap = new Map<string, number>();
      voteCounts?.forEach(v => {
        voteCountMap.set(v.report_id, (voteCountMap.get(v.report_id) || 0) + 1);
      });

      // Batch-fetch user votes
      const userVoteSet = new Set<string>();
      if (userRef.current && reportIds.length > 0) {
        const { data: userVotes } = await supabase
          .from('votes')
          .select('report_id')
          .eq('user_id', userRef.current.id)
          .in('report_id', reportIds);
        userVotes?.forEach(v => userVoteSet.add(v.report_id));
      } else if (reportIds.length > 0) {
        // Guest vote status
        const { data: guestVotes } = await supabase
          .from('votes')
          .select('report_id')
          .eq('anon_id', getGuestId())
          .in('report_id', reportIds);
        guestVotes?.forEach(v => userVoteSet.add(v.report_id));
      }

      const reportsWithVotes = (data || []).map(report => ({
        ...report,
        vote_count: voteCountMap.get(report.id) || 0,
        user_has_voted: userVoteSet.has(report.id)
      } as Report));

      // Sort by votes if needed
      if (sortBy === 'votes') {
        reportsWithVotes.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
      }

      setReports(reportsWithVotes);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [sortBy, showResolved]);

  const [votedPulse, setVotedPulse] = useState<string | null>(null);
  const [pendingVote, setPendingVote] = useState<Record<string, boolean>>({});

  const handleUpvote = async (reportId: string, currentVoteStatus: boolean) => {
    const currentUser = userRef.current;
    const target = !currentVoteStatus;
    // Optimistic update
    setPendingVote(prev => ({ ...prev, [reportId]: true }));
    setVotedPulse(null);
    requestAnimationFrame(() => setVotedPulse(reportId));
    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? { ...r, user_has_voted: target, vote_count: (r.vote_count || 0) + (target ? 1 : -1) }
          : r
      )
    );

    try {
      const { error } = await toggleVote(reportId, currentVoteStatus, currentUser, getGuestId);
      if (error) throw error;

      // Refresh to sync counts from server
      await fetchReports();
      setVotedPulse(reportId);
      setTimeout(() => setVotedPulse(null), 600);
    } catch (error) {
      console.error('Error toggling vote:', error);
      // Rollback optimistic update
      setReports(prev =>
        prev.map(r =>
          r.id === reportId
            ? { ...r, user_has_voted: currentVoteStatus, vote_count: (r.vote_count || 0) + (target ? -1 : 1) }
            : r
        )
      );
      toast({
        title: "Error",
        description: "Failed to update vote",
        variant: "destructive"
      });
    } finally {
      setPendingVote(prev => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
    }
  };

  const getLocationName = (lat: number, lng: number) => {
    // Simple location display - in a real app you'd use reverse geocoding
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Community Reports</h1>
          <p className="text-muted-foreground mt-2">Browse and interact with reports from your community</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="votes">Most Voted</SelectItem>
              <SelectItem value="resolved">Resolved Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={showResolved ? "default" : "outline"}
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? "Show All" : "Include Resolved"}
          </Button>
        </div>
      </div>

      {/* Camera Preview Section */}
      <Card className="mb-8 glass-card animate-fade-in">
        <CardContent className="p-6">
          <div className="text-center">
            {!isCameraOpen && !capturedImage && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-2">Quick Report</h2>
                <p className="text-muted-foreground mb-4">
                  Capture an issue right now and create a report instantly
                </p>
                <Button 
                  onClick={startCamera}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-lg hover-scale"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Open Camera
                </Button>
              </div>
            )}

            {isCameraOpen && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-muted-foreground">Live Camera Feed</span>
                </div>
                
                <div className="relative mx-auto max-w-md">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-2xl border-2 border-primary/20"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Camera controls overlay */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 shadow-lg hover-scale"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                    <Button
                      onClick={stopCamera}
                      size="lg"
                      variant="outline"
                      className="rounded-full w-16 h-16 shadow-lg hover-scale"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Tap the red button to capture • Tap X to close camera
                </p>
              </div>
            )}

            {capturedImage && (
              <div className="space-y-4 animate-scale-in">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-muted-foreground">Captured Image</span>
                </div>
                
                <div className="relative mx-auto max-w-md">
                  <img
                    src={capturedImage}
                    alt="Captured photo"
                    className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-2xl border-2 border-green-500/20"
                  />
                </div>
                
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={retakePhoto}
                    variant="outline"
                    className="rounded-full px-6 py-2 hover-scale"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                  <Button
                    onClick={proceedToReport}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-2 hover-scale"
                  >
                    Create Report
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Photo captured successfully • Create report or retake if needed
                </p>
              </div>
            )}

            {cameraError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center animate-fade-in">
                <p className="text-destructive text-sm">{cameraError}</p>
                <Button 
                  onClick={() => setCameraError(null)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No reports found</h3>
          <p className="text-muted-foreground">Be the first to report an issue in your community!</p>
        </div>
      ) : (
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
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <Badge 
                  className={`absolute top-2 right-2 ${
                    report.status === 'resolved' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {report.status === 'resolved' ? 'Resolved' : 'Pending'}
                </Badge>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{report.title}</h3>
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{report.description}</p>
                
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
                  <div className="text-sm text-muted-foreground">
                    {report.is_anonymous ? 'Anonymous' : 'User'}
                  </div>
                  
                  <Button
                    variant={report.user_has_voted ? "default" : "outline"}
                    size="sm"
                    disabled={!!pendingVote[report.id]}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpvote(report.id, report.user_has_voted || false);
                    }}
                    className={`flex items-center gap-1 vote-btn ${votedPulse === report.id ? 'vote-pop' : ''} ${report.user_has_voted ? 'vote-active' : ''}`}
                  >
                    <ThumbsUp className={`w-4 h-4 vote-thumb ${report.user_has_voted ? 'fill-current' : ''}`} />
                    {report.vote_count || 0}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </Reveal>
          ))}
        </div>
      )}

    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Flag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Report {
  id: string;
  title: string;
  description: string;
  issue_type: string;
  latitude: number;
  longitude: number;
  status: string;
  media_url: string;
  created_at: string;
  user_id: string;
  is_anonymous: boolean;
}

const ABUSE_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'false_misleading', label: 'False or misleading information' },
  { value: 'inappropriate_content', label: 'Inappropriate content (offensive, graphic, etc.)' },
  { value: 'duplicate', label: 'Duplicate issue' },
  { value: 'harassment', label: 'Personal attack or targeted harassment' },
  { value: 'other', label: 'Other (please explain)' }
];

export default function ReportAbuse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [hasAlreadyReported, setHasAlreadyReported] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchReport();
      checkIfAlreadyReported();
    }
  }, [id, user]);

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setReport(data);
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

  const checkIfAlreadyReported = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .rpc('user_has_reported_abuse', { 
          report_id: id, 
          user_id: user.id 
        });

      if (error) throw error;
      setHasAlreadyReported(data || false);
    } catch (error) {
      console.error('Error checking if already reported:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user || !id || !selectedReason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive"
      });
      return;
    }

    if (selectedReason === 'other' && !additionalComments.trim()) {
      toast({
        title: "Error",
        description: "Please provide additional details for 'Other' reason",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('abuse_reports')
        .insert({
          report_id: id,
          flagged_by_user_id: user.id,
          reason: selectedReason,
          additional_comments: additionalComments.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thanks for reporting. Our moderators will review it shortly."
      });

      navigate(-1);
    } catch (error: any) {
      console.error('Error submitting abuse report:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        toast({
          title: "Already Reported",
          description: "You've already reported this post. Thank you!",
          variant: "destructive"
        });
        setHasAlreadyReported(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to submit report. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Report not found</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Flag className="w-6 h-6 text-red-500" />
              Report Issue
            </h1>
            <p className="text-muted-foreground">Help us maintain a safe community</p>
          </div>
        </div>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report being flagged:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {report.media_url && (
                <img 
                  src={report.media_url} 
                  alt="Report thumbnail"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">{report.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{report.issue_type}</Badge>
                  <Badge variant={report.status === 'resolved' ? 'default' : 'outline'}>
                    {report.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Reported by: {report.is_anonymous ? 'Anonymous' : 'User'} • {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Form */}
        {hasAlreadyReported ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500" />
                <h3 className="text-lg font-semibold">Already Reported</h3>
                <p className="text-muted-foreground">
                  You've already reported this post. Thank you for helping keep our community safe!
                </p>
                <Button onClick={() => navigate(-1)} variant="outline">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why are you reporting this?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">Select a reason:</Label>
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                  {ABUSE_REASONS.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.value} id={reason.value} />
                      <Label htmlFor={reason.value} className="cursor-pointer">
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {(selectedReason === 'other' || selectedReason) && (
                <div className="space-y-2">
                  <Label htmlFor="comments" className="text-base font-medium">
                    Additional Comments {selectedReason === 'other' && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder={selectedReason === 'other' 
                      ? "Please provide more details about the issue..." 
                      : "Optional: Provide additional context (max 500 characters)"
                    }
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    {additionalComments.length}/500 characters
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSubmit} 
                  disabled={!selectedReason || submitting}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Community Guidelines</p>
                <p>
                  Reports are reviewed by our moderation team. False reporting may result in restrictions on your account. 
                  Thank you for helping maintain a safe and constructive community.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
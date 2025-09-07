import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Copy, Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

export default function ShareToAuthorities() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCount, setShareCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchReport();
      fetchShareCount();
    }
  }, [id]);

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

  const fetchShareCount = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_share_count', { report_id: id });

      if (error) throw error;
      setShareCount(data || 0);
    } catch (error) {
      console.error('Error fetching share count:', error);
    }
  };

  const logShare = async (method: string) => {
    if (!user || !id) return;

    try {
      await supabase
        .from('share_logs')
        .insert({
          user_id: user.id,
          report_id: id,
          method
        });
      
      setShareCount(prev => prev + 1);
    } catch (error) {
      console.error('Error logging share:', error);
    }
  };

  const generateShareText = () => {
    if (!report) return '';
    
    const location = `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`;
    const reportUrl = `${window.location.origin}/issue/${report.id}`;
    
    return `🚨 Civic Issue Alert: ${report.title}
    
📍 Location: ${location}
🏷️ Category: ${report.issue_type}
📅 Reported: ${new Date(report.created_at).toLocaleDateString()}

${report.description}

View full details: ${reportUrl}

#FixTheMess #CivicEngagement`;
  };

  const handleShare = async (platform: string) => {
    const shareText = generateShareText();
    const reportUrl = `${window.location.origin}/issue/${report?.id}`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reportUrl)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(reportUrl)}&text=${encodeURIComponent(shareText)}`);
        break;
      case 'copy_link':
        await navigator.clipboard.writeText(reportUrl);
        toast({
          title: "Success!",
          description: "Link copied to clipboard"
        });
        break;
      case 'email':
        const subject = `Civic Issue Reported: ${report?.title}`;
        const body = shareText.replace(/\n/g, '%0D%0A');
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        break;
      case 'authority_email':
        const authSubject = `Civic Issue Reported in Your Jurisdiction`;
        const authBody = `Dear Local Authority,

A civic issue has been reported through FixTheMess platform:

Title: ${report?.title}
Category: ${report?.issue_type}
Location: ${report?.latitude.toFixed(6)}, ${report?.longitude.toFixed(6)}
Reported On: ${new Date(report?.created_at || '').toLocaleDateString()}

Description:
${report?.description}

This issue has been shared ${shareCount} times by concerned citizens. Please review and take appropriate action.

View full details and images: ${reportUrl}

Thank you for your attention to civic matters.

Best regards,
A Concerned Citizen via FixTheMess`;
        window.open(`mailto:?subject=${encodeURIComponent(authSubject)}&body=${encodeURIComponent(authBody)}`);
        break;
    }
    
    await logShare(platform);
    toast({
      title: "Shared Successfully!",
      description: `Report shared via ${platform}`
    });
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
          <Button onClick={() => navigate('/')} variant="outline">
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
            <h1 className="text-2xl font-bold">Share This Issue</h1>
            <p className="text-muted-foreground">Help get this issue the attention it deserves</p>
          </div>
        </div>

        {/* Report Preview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{report.issue_type}</Badge>
                  <Badge variant={report.status === 'resolved' ? 'default' : 'outline'}>
                    {report.status}
                  </Badge>
                </div>
              </div>
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{report.description}</p>
            
            {report.media_url && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={report.media_url} 
                  alt="Report media"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>📍 {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
              <span>Shared {shareCount} times</span>
            </div>
          </CardContent>
        </Card>

        {/* Social Share Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share on Social Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 justify-start gap-3"
                onClick={() => handleShare('whatsapp')}
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                WhatsApp
              </Button>
              
              <Button
                variant="outline"
                className="h-12 justify-start gap-3"
                onClick={() => handleShare('twitter')}
              >
                <div className="w-5 h-5 bg-blue-500 rounded" />
                Twitter / X
              </Button>
              
              <Button
                variant="outline"
                className="h-12 justify-start gap-3"
                onClick={() => handleShare('facebook')}
              >
                <div className="w-5 h-5 bg-blue-600 rounded" />
                Facebook
              </Button>
              
              <Button
                variant="outline"
                className="h-12 justify-start gap-3"
                onClick={() => handleShare('telegram')}
              >
                <div className="w-5 h-5 bg-blue-400 rounded" />
                Telegram
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Authority Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Authorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => handleShare('authority_email')}
            >
              <Mail className="w-5 h-5 text-red-600" />
              Email Local Authority
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => handleShare('email')}
            >
              <Mail className="w-5 h-5" />
              Send via Email
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => handleShare('copy_link')}
            >
              <Copy className="w-5 h-5" />
              Copy Direct Link
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
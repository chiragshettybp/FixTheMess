import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, Clock, Upload, CheckCircle, Calendar, User } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  resolved_image_url: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
}

export default function GovResolve() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resolvedImage, setResolvedImage] = useState<File | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

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

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResolvedImage(file);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${report?.id || Date.now()}_resolved_${Date.now()}.${fileExt}`;
      const filePath = fileName; // Remove prefix as it's the bucket name

      const { data, error: uploadError } = await supabase.storage
        .from('resolved-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast({
          title: "Upload Failed",
          description: uploadError.message || "Failed to upload resolution image",
          variant: "destructive"
        });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('resolved-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred during upload",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleMarkAsResolved = async () => {
    if (!report || !user || !resolvedImage) {
      toast({
        title: "Missing Information",
        description: "Please upload a resolution image",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Upload the resolved image
      const imageUrl = await uploadImageToStorage(resolvedImage);
      
      if (!imageUrl) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload resolution image",
          variant: "destructive"
        });
        return;
      }

      // Update the report status
      const { error } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          resolved_image_url: imageUrl,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id);

      if (error) {
        console.error('Error updating report:', error);
        toast({
          title: "Error",
          description: "Failed to mark report as resolved",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Report has been marked as resolved",
      });

      // Navigate back to gov panel
      navigate('/gov-panel');
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: "Error",
        description: "Failed to mark report as resolved",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">Loading report details...</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Report not found</h3>
          <p className="text-muted-foreground mb-4">The report you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/gov-panel')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/gov-panel')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{report.title}</CardTitle>
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
          
          <CardContent className="space-y-4">
            {/* Original Media */}
            <div className="aspect-video relative overflow-hidden rounded-lg">
              <img
                src={report.media_url}
                alt={report.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground text-sm">
                {report.description || 'No description provided.'}
              </p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 gap-3 pt-4 border-t text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <div>
                  <div>Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</div>
                  <div className="text-xs">{format(new Date(report.created_at), 'PPpp')}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <div>
                  <div>Location: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <div>Issue Type: <span className="capitalize">{report.issue_type.replace('_', ' ')}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Mark as Resolved</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {report.status === 'resolved' ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-600 mb-2">Already Resolved</h3>
                <p className="text-muted-foreground">This report has already been marked as resolved.</p>
                {report.resolved_at && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Resolved on {format(new Date(report.resolved_at), 'PPpp')}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Resolution Photo <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a photo showing the resolved issue
                  </p>
                  
                  {resolvedImage && (
                    <div className="mt-4">
                      <img
                        src={URL.createObjectURL(resolvedImage)}
                        alt="Resolution preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Resolution Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Add any notes about the resolution..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleMarkAsResolved}
                  disabled={!resolvedImage || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
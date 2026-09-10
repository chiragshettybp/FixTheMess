import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Report } from '@/hooks/useGovernmentReports';
import { Calendar, MapPin, User, Upload, CheckCircle, X } from 'lucide-react';

interface ReportDetailModalProps {
  report: Report | null;
  open: boolean;
  onClose: () => void;
  onMarkResolved: (reportId: string, imageUrl: string) => Promise<{ error: string | null }>;
}

export const ReportDetailModal = ({ 
  report, 
  open, 
  onClose, 
  onMarkResolved 
}: ReportDetailModalProps) => {
  const { toast } = useToast();
  const [resolvedImage, setResolvedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [marking, setMarking] = useState(false);

  if (!report) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'New';
      case 'urgent': return 'Urgent';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      setResolvedImage(file);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${report.id}_resolved_${Date.now()}.${fileExt}`;
      const filePath = fileName; // Remove 'resolved-images/' prefix as it's the bucket name

      const { data, error: uploadError } = await supabase.storage
        .from('resolved-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload failed",
          description: uploadError.message || "Failed to upload the resolved image",
          variant: "destructive"
        });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('resolved-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred during upload",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleMarkAsResolved = async () => {
    if (!resolvedImage) {
      toast({
        title: "Image required",
        description: "Please upload a photo showing the resolved issue",
        variant: "destructive"
      });
      return;
    }

    try {
      setMarking(true);
      
      // Upload image
      const imageUrl = await uploadImageToStorage(resolvedImage);
      if (!imageUrl) {
        toast({
          title: "Upload failed",
          description: "Failed to upload the resolved image",
          variant: "destructive"
        });
        return;
      }

      // Mark as resolved
      const { error } = await onMarkResolved(report.id, imageUrl);
      if (error) {
        toast({
          title: "Failed to mark as resolved",
          description: error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Report resolved",
        description: "The report has been successfully marked as resolved",
      });

      // Close modal and reset state
      setResolvedImage(null);
      onClose();
    } catch (error) {
      console.error('Error marking as resolved:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setMarking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{report.title}</DialogTitle>
            <Badge className={getStatusColor(report.status)}>
              {getStatusLabel(report.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Submitted by:</span>
                  <span>{report.is_anonymous ? 'Anonymous Citizen' : 'Registered Citizen'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Submitted:</span>
                  <span>{formatDate(report.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                  <span>{report.latitude?.toFixed(6) ?? 'N/A'}, {report.longitude?.toFixed(6) ?? 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Category:</span>
                  <Badge variant="outline">{report.issue_type}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {report.description && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Original Image */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Reported Issue Photo</h3>
              <img 
                src={report.media_url} 
                alt="Reported issue" 
                className="w-full max-w-md rounded-lg border"
              />
            </CardContent>
          </Card>

          {/* Resolution Section */}
          {report.status === 'resolved' && report.resolved_image_url ? (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resolution Photo
                </h3>
                <img 
                  src={report.resolved_image_url} 
                  alt="Resolution proof" 
                  className="w-full max-w-md rounded-lg border"
                />
                {report.resolved_at && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Resolved on: {formatDate(report.resolved_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : report.status !== 'resolved' && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Mark as Resolved</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resolved-image">Upload Resolution Photo *</Label>
                    <Input
                      id="resolved-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a photo showing the resolved issue (max 10MB)
                    </p>
                  </div>

                  {resolvedImage && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Image selected: {resolvedImage.name}</span>
                    </div>
                  )}

                  <Button 
                    onClick={handleMarkAsResolved}
                    disabled={!resolvedImage || uploading || marking}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : marking ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marking as Resolved...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map View */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Location Map</h3>
              <div className="bg-muted rounded-lg p-8 text-center">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Map integration will show exact location
                </p>
                <p className="text-sm text-muted-foreground">
                  Coordinates: {report.latitude}, {report.longitude}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
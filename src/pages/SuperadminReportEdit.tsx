import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  Save,
  Upload,
  X,
  AlertTriangle,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import { toast } from 'sonner';

interface Report {
  id: string;
  title: string;
  description: string;
  status: string;
  issue_type: string;
  media_url: string;
  user_id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

const SuperadminReportEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab] = useState('reports');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [issueType, setIssueType] = useState('');
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not superadmin
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'superadmin')) {
      navigate('/auth');
    }
  }, [user, profile, loading, navigate]);

  // Fetch report data
  useEffect(() => {
    if (!id || !user || profile?.role !== 'superadmin') return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setReport(data);
          setTitle(data.title);
          setDescription(data.description || '');
          setStatus(data.status);
          setIssueType(data.issue_type);
          setMediaFiles(data.media_url ? [data.media_url] : []);
        }
      } catch (err: any) {
        console.error('Error fetching report:', err);
        setError(err.message);
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, user, profile]);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!status) {
      newErrors.status = 'Status is required';
    }

    if (!issueType) {
      newErrors.issueType = 'Issue type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedFiles: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          toast.error('Only image files are allowed');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error('File size must be less than 5MB');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { data, error } = await supabase.storage
          .from('report-media')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('report-media')
          .getPublicUrl(filePath);

        uploadedFiles.push(publicUrl);
      }

      setMediaFiles([...mediaFiles, ...uploadedFiles]);
      toast.success(`Uploaded ${uploadedFiles.length} file(s)`);
    } catch (err: any) {
      console.error('Error uploading files:', err);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  // Remove media file
  const removeMediaFile = async (url: string) => {
    try {
      // Extract file path from URL for deletion from storage
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `reports/${fileName}`;

      // Remove from storage
      const { error } = await supabase.storage
        .from('report-media')
        .remove([filePath]);

      if (error) {
        console.error('Error removing from storage:', error);
        // Continue anyway to remove from UI
      }

      // Remove from local state
      setMediaFiles(mediaFiles.filter(f => f !== url));
      toast.success('File removed');
    } catch (err: any) {
      console.error('Error removing file:', err);
      toast.error('Failed to remove file');
    }
  };

  // Save report
  const handleSave = async () => {
    if (!validateForm() || !report) return;

    setSaving(true);
    try {
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        status,
        issue_type: issueType,
        media_url: mediaFiles[0] || null, // Use first media file as primary
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', report.id);

      if (error) throw error;

      toast.success('Report updated successfully');
      navigate('/superadmin/reports');
    } catch (err: any) {
      console.error('Error updating report:', err);
      toast.error('Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'resolved': return 'secondary';
      case 'rejected': return 'destructive';
      case 'hidden': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex-1 p-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || 'Report not found'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="flex flex-col lg:flex-row">
        
        <div className="flex-1 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/superadmin/reports')}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Reports
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/superadmin" className="hover:text-foreground">SuperAdmin</Link>
                <span>→</span>
                <Link to="/superadmin/reports" className="hover:text-foreground">Reports</Link>
                <span>→</span>
                <span>Edit Report</span>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold">Edit Report</h1>
                <Badge variant={getStatusColor(report.status)}>{report.status}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="xl:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Details</CardTitle>
                  <CardDescription>
                    Edit the report information below
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Report title"
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Report description"
                      rows={4}
                      className={errors.description ? 'border-destructive' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                  </div>

                  {/* Status and Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status *</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.status && (
                        <p className="text-sm text-destructive">{errors.status}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Issue Type *</Label>
                      <Select value={issueType} onValueChange={setIssueType}>
                        <SelectTrigger className={errors.issueType ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                          <SelectItem value="environment">Environment</SelectItem>
                          <SelectItem value="public_service">Public Service</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.issueType && (
                        <p className="text-sm text-destructive">{errors.issueType}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Media Files
                  </CardTitle>
                  <CardDescription>
                    Upload and manage images for this report
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Button */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <Label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer" disabled={uploading}>
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Images
                          </>
                        )}
                      </Button>
                    </Label>
                  </div>

                  {/* Media Preview */}
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {mediaFiles.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Media ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeMediaFile(url)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {mediaFiles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="mx-auto h-12 w-12 mb-4" />
                      <p>No images uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/superadmin/reports')}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              {/* Report Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Report ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {report.id.slice(0, 8)}...
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.updated_at).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm text-muted-foreground">
                      {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminReportEdit;
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, Camera, MapPin, Clock, AlertCircle, Loader2, X, RotateCcw, Plus } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface FormData {
  title: string;
  description: string;
  issueType: string;
  isAnonymous: boolean;
}

interface CapturedPhoto {
  id: string;
  file: File;
  preview: string;
  timestamp: number;
}

const ReportIssue = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    issueType: 'other',
    isAnonymous: false,
  });

  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Guest login gate
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Camera cleanup
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoords = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
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
      setIsLoadingAddress(false);
    }
  };

  // Get user's location on component mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          // Get address from coordinates
          const address = await getAddressFromCoords(coords.latitude, coords.longitude);
          
          setLocation({
            ...coords,
            address: address || undefined
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationError('Unable to get your location. Please enable location services.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  // Check for captured image from camera preview on feed page
  useEffect(() => {
    const capturedImage = sessionStorage.getItem('capturedReportImage');
    if (capturedImage) {
      // Validate data URL format
      if (!capturedImage.startsWith('data:image/')) {
        sessionStorage.removeItem('capturedReportImage');
        return;
      }
      // Convert data URL to File object
      const dataURLtoFile = (dataurl: string, filename: string): File => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      };

      const file = dataURLtoFile(capturedImage, `captured_${Date.now()}.jpg`);
      const photo: CapturedPhoto = {
        id: `captured-${Date.now()}`,
        file,
        preview: capturedImage,
        timestamp: Date.now(),
      };

      setCapturedPhotos([photo]);
      sessionStorage.removeItem('capturedReportImage');
      
      toast({
        title: 'Photo loaded!',
        description: 'Your captured photo has been loaded into the report form.',
      });
    }
  }, [toast]);

  // Compress image before adding to photos
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Camera access denied or not available. Please use file upload instead.');
    }
  };

  // Capture photo from camera
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Add haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const timestamp = Date.now();
      const file = new File([blob], `captured-${timestamp}.jpg`, {
        type: 'image/jpeg',
        lastModified: timestamp,
      });

      // Compress the image
      const compressedFile = await compressImage(file);
      
      const photo: CapturedPhoto = {
        id: `photo-${timestamp}`,
        file: compressedFile,
        preview: URL.createObjectURL(compressedFile),
        timestamp,
      };

      setCapturedPhotos(prev => [...prev, photo]);
      stopCamera();
      
      toast({
        title: 'Photo captured!',
        description: 'Photo added to your report.',
      });
    }, 'image/jpeg', 0.8);
  };

  // Handle file selection from input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if we already have 3 photos
    if (capturedPhotos.length >= 3) {
      toast({
        title: 'Maximum photos reached',
        description: 'You can only add up to 3 photos per report.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, WebP).',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const addPhoto = async () => {
      const compressedFile = await compressImage(file);
      const timestamp = Date.now();
      
      const photo: CapturedPhoto = {
        id: `file-${timestamp}`,
        file: compressedFile,
        preview: URL.createObjectURL(compressedFile),
        timestamp,
      };

      setCapturedPhotos(prev => [...prev, photo]);
    };

    addPhoto();
  };

  // Remove photo
  const removePhoto = (photoId: string) => {
    setCapturedPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === photoId);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  // Upload multiple files
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = 'jpg'; // All images are compressed to JPEG
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('report-media')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('report-media')
        .getPublicUrl(filePath);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const submitReport = async () => {
    const currentUser = userRef.current;

    if (capturedPhotos.length === 0) {
      toast({
        title: 'Photos required',
        description: 'Please capture or upload at least one photo of the issue.',
        variant: 'destructive',
      });
      return;
    }

    if (!location) {
      toast({
        title: 'Location required',
        description: 'Location access is required to submit a report.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all photos to storage
      const files = capturedPhotos.map(photo => photo.file);
      const mediaUrls = await uploadFiles(files);

      // Insert report to database with first photo as main media_url
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        issue_type: formData.issueType,
        media_url: mediaUrls[0], // First photo as main media
        latitude: location.latitude,
        longitude: location.longitude,
        is_anonymous: formData.isAnonymous,
        user_id: formData.isAnonymous ? null : currentUser?.id,
        status: 'pending',
      };

      const { error: insertError } = await supabase
        .from('reports')
        .insert(reportData);

      if (insertError) {
        throw new Error(`Failed to save report: ${insertError.message}`);
      }

      toast({
        title: 'Report submitted successfully!',
        description: `Your report with ${capturedPhotos.length} photo${capturedPhotos.length > 1 ? 's' : ''} has been submitted.`,
      });

      // Clean up preview URLs
      capturedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));

      // Navigate to feed page to see the new report
      navigate('/feed');

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please provide a title for your report.',
        variant: 'destructive',
      });
      return;
    }

    // Require authentication before submitting a report
    if (!userRef.current) {
      await saveDraft();
      sessionStorage.setItem('fixTheMessResumeReport', '1');
      navigate('/auth');
      return;
    }

    submitReport();
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const saveDraft = async () => {
    try {
      const photoData = await Promise.all(
        capturedPhotos.map(async (photo) => ({
          id: photo.id,
          timestamp: photo.timestamp,
          dataUrl: await fileToDataURL(photo.file),
        }))
      );
      sessionStorage.setItem(
        'fixTheMessReportDraft',
        JSON.stringify({ formData, location, capturedPhotos: photoData })
      );
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const restoreDraft = () => {
    const raw = sessionStorage.getItem('fixTheMessReportDraft');
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.formData) setFormData(draft.formData);
      if (draft.location) setLocation(draft.location);
      if (Array.isArray(draft.capturedPhotos) && draft.capturedPhotos.length > 0) {
        const photos: CapturedPhoto[] = draft.capturedPhotos.map(
          (p: { id: string; timestamp: number; dataUrl: string }) => {
            const file = dataURLtoFile(p.dataUrl, `draft-${p.timestamp}.jpg`);
            return {
              id: p.id,
              file,
              preview: URL.createObjectURL(file),
              timestamp: p.timestamp,
            };
          }
        );
        setCapturedPhotos(photos);
      }
      sessionStorage.removeItem('fixTheMessReportDraft');
      toast({
        title: 'Draft restored',
        description: 'Your previously entered report details have been restored.',
      });
    } catch (error) {
      console.error('Error restoring draft:', error);
      sessionStorage.removeItem('fixTheMessReportDraft');
    }
  };

  useEffect(() => {
    const resume = sessionStorage.getItem('fixTheMessResumeReport');
    if (resume && userRef.current) {
      sessionStorage.removeItem('fixTheMessResumeReport');
      restoreDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = formData.title.trim() && capturedPhotos.length > 0 && location && !isSubmitting;

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Report an Issue</h1>
            <p className="text-muted-foreground mt-2">
              Help improve your community by reporting infrastructure problems.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Desktop: Two-column layout, Mobile: Single column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Form Fields */}
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Issue Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Pothole on Main Street"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={100}
                  />
                </div>

                {/* Issue Type */}
                <div className="space-y-2">
                  <Label>Issue Type</Label>
                  <Select
                    value={formData.issueType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, issueType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pothole">Pothole</SelectItem>
                      <SelectItem value="open_wire">Open Wire/Electrical</SelectItem>
                      <SelectItem value="garbage">Garbage/Waste</SelectItem>
                      <SelectItem value="water_logging">Water Logging</SelectItem>
                      <SelectItem value="road_damage">Road Damage</SelectItem>
                      <SelectItem value="streetlight">Street Light</SelectItem>
                      <SelectItem value="sewage">Sewage Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide additional details about the issue..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    maxLength={500}
                  />
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="anonymous"
                    checked={formData.isAnonymous}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAnonymous: checked }))}
                  />
                  <Label htmlFor="anonymous">Report Anonymously</Label>
                </div>

                {/* Metadata Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Location</p>
                          {isLoadingAddress ? (
                            <p className="text-xs text-muted-foreground">Getting address...</p>
                          ) : location ? (
                            <div className="space-y-1">
                              {location.address && (
                                <p className="text-xs text-foreground font-medium">{location.address}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-destructive">
                              {locationError || 'Getting location...'}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Timestamp</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date().toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column: Camera & Photo Capture */}
              <div className="space-y-4">
                <Label>Capture Photos *</Label>
                
                {/* Camera Interface - Full Screen on Mobile */}
                {isCameraOpen ? (
                  <div className="fixed inset-0 z-50 bg-black lg:relative lg:z-auto lg:bg-transparent">
                    {/* Mobile: Full screen camera */}
                    <div className="lg:hidden relative h-full">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {/* Mobile Camera Controls */}
                      <div className="absolute bottom-8 left-0 right-0">
                        {/* Top row: Close button and counter */}
                        <div className="flex justify-between items-center px-6 mb-8">
                          <Button
                            type="button"
                            size="lg"
                            variant="ghost"
                            onClick={stopCamera}
                            className="rounded-full w-12 h-12 bg-black/30 hover:bg-black/50 text-white border-white/20"
                          >
                            <X className="h-6 w-6" />
                          </Button>
                          <div className="bg-black/50 px-3 py-1 rounded-full">
                            <p className="text-white text-sm font-medium">
                              {3 - capturedPhotos.length} remaining
                            </p>
                          </div>
                        </div>
                        
                        {/* Bottom row: Capture button */}
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            size="lg"
                            onClick={capturePhoto}
                            className="bg-white hover:bg-gray-100 text-black rounded-full w-20 h-20 shadow-lg border-4 border-black/20"
                            disabled={capturedPhotos.length >= 3}
                          >
                            <Camera className="h-8 w-8" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop: Card layout */}
                    <Card className="hidden lg:block border-2 border-primary">
                      <CardContent className="p-4">
                        <div className="relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-64 object-cover rounded-md bg-black"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                          
                          {/* Desktop Camera Controls */}
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                            <Button
                              type="button"
                              size="lg"
                              onClick={capturePhoto}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16"
                              disabled={capturedPhotos.length >= 3}
                            >
                              <Camera className="h-6 w-6" />
                            </Button>
                            <Button
                              type="button"
                              size="lg"
                              variant="outline"
                              onClick={stopCamera}
                              className="rounded-full w-16 h-16"
                            >
                              <X className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Tap the red button to capture • {3 - capturedPhotos.length} photos remaining
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  /* Camera Launch & Upload Options */
                  <div className="space-y-3">
                    {/* Camera Launch Button */}
                    <Button
                      type="button"
                      onClick={startCamera}
                      className="w-full h-16 text-lg font-semibold bg-primary hover:bg-primary/90"
                      disabled={capturedPhotos.length >= 3}
                    >
                      <Camera className="mr-3 h-6 w-6" />
                      Take Photo
                    </Button>
                    
                    {/* File Upload Fallback */}
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={capturedPhotos.length >= 3}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload from Gallery
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Camera Error */}
                {cameraError && (
                  <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{cameraError}</p>
                  </div>
                )}

                {/* Photo Gallery */}
                {capturedPhotos.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Captured Photos ({capturedPhotos.length}/3)</h3>
                        {capturedPhotos.length < 3 && !isCameraOpen && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={startCamera}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add More
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {capturedPhotos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.preview}
                              alt={`Captured photo ${photo.timestamp}`}
                              className="w-full h-24 object-cover rounded-md border"
                            />
                            
                            {/* Remove Button */}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removePhoto(photo.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            
                            {/* Photo timestamp */}
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                              {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {locationError && (
                  <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{locationError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button - Sticky on mobile */}
            <div className="lg:pt-6">
              {/* Mobile Submit Button - Fixed at bottom with proper visibility */}
              <div className="lg:hidden fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg z-50">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg"
                  disabled={!canSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </div>

              {/* Desktop Submit Button - Normal position */}
              <div className="hidden lg:block">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full max-w-md mx-auto"
                  disabled={!canSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Add bottom padding on mobile to account for sticky button */}
          <div className="h-20 lg:hidden"></div>
        </div>
      </div>
  );
};

export default ReportIssue;
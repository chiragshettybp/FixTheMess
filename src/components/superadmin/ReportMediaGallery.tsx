import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { ReportMedia } from '@/hooks/useSuperadminReportDetail';

interface ReportMediaGalleryProps {
  media: ReportMedia[];
}

export const ReportMediaGallery = ({ media }: ReportMediaGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!media || media.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No media available for this report
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMedia = media[currentIndex];

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = currentMedia.url;
    link.download = `report-media-${currentIndex + 1}`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Media Gallery</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{currentIndex + 1} of {media.length}</Badge>
            <Button size="sm" variant="outline" onClick={downloadMedia}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Navigation Controls */}
          {media.length > 1 && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
                onClick={prevImage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                onClick={nextImage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Zoom Control */}
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 z-10"
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          {/* Media Display */}
          <div className={`relative overflow-hidden rounded-lg ${isZoomed ? 'h-96' : 'h-64'} bg-muted`}>
            {currentMedia.type === 'video' ? (
              <video
                src={currentMedia.url}
                controls
                className="w-full h-full object-cover"
                poster={currentMedia.metadata?.thumbnail}
              />
            ) : (
              <img
                src={currentMedia.url}
                alt={`Report media ${currentIndex + 1}`}
                className={`w-full h-full object-cover transition-transform cursor-pointer ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            )}
          </div>

          {/* Media Info */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline">{currentMedia.type.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploaded:</span>
              <span>{new Date(currentMedia.created_at).toLocaleString()}</span>
            </div>
            {currentMedia.metadata?.exif && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">EXIF Timestamp:</span>
                <span>{new Date(currentMedia.metadata.exif.timestamp).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Thumbnail Navigation */}
          {media.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {media.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                    index === currentIndex ? 'border-primary' : 'border-muted'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                      Video
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
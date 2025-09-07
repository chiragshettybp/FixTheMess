import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Edit, ExternalLink, Navigation } from 'lucide-react';
import { ReportDetail } from '@/hooks/useSuperadminReportDetail';
import { Link } from 'react-router-dom';

interface ReportLocationCardProps {
  report: ReportDetail;
}

export const ReportLocationCard = ({ report }: ReportLocationCardProps) => {
  // Generate a simple static map URL (you would use a real mapping service)
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${report.longitude},${report.latitude},15,0/400x200?access_token=pk.example`;
  
  // Reverse geocode coordinates to address (mock implementation)
  const generateAddress = (lat: number, lng: number) => {
    // In a real app, you'd use a geocoding service
    return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
  };

  const address = generateAddress(report.latitude, report.longitude);

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Location
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to={`/map?lat=${report.latitude}&lng=${report.longitude}&zoom=15`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Full Map
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Static Map Preview */}
        <div className="relative">
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border">
            {/* Placeholder for static map */}
            <div className="text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Map Preview</p>
              <p className="text-xs text-muted-foreground">
                {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
              </p>
            </div>
          </div>
          
          {/* Overlay Controls */}
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2"
            onClick={openInMaps}
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>

        {/* Location Details */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Address</h4>
            <p className="text-sm">{address}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Latitude</h4>
              <p className="text-sm font-mono">{report.latitude.toFixed(6)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Longitude</h4>
              <p className="text-sm font-mono">{report.longitude.toFixed(6)}</p>
            </div>
          </div>

          {/* City/Region Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Administrative Region</h4>
            <div className="flex gap-2">
              {report.region_id ? (
                <Badge variant="default">Assigned Region</Badge>
              ) : (
                <Badge variant="outline">Unassigned</Badge>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={openInMaps} className="flex-1">
                <Navigation className="w-4 h-4 mr-2" />
                Open in Google Maps
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <MapPin className="w-4 h-4 mr-2" />
                View Nearby Reports
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
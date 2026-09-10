import React, { useEffect, useState, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Search, Filter, Navigation, ThumbsUp, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Set your Mapbox access token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

interface Report {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  issue_type: string;
  status: string;
  media_url: string;
  created_at: string;
  user_id: string;
  vote_count?: number;
}

interface Filters {
  status: 'all' | 'pending' | 'resolved';
  issue_type: 'all' | 'pothole' | 'wire' | 'garbage' | 'water' | 'other';
  search: string;
  nearby_only: boolean;
}

const MapView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    issue_type: 'all',
    search: '',
    nearby_only: false
  });
  const [mapboxToken] = useState(MAPBOX_TOKEN);

  // Calculate distance between two points in meters
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Filter reports based on current filters
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    // Issue type filter
    if (filters.issue_type !== 'all') {
      filtered = filtered.filter(report => report.issue_type === filters.issue_type);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm) ||
        report.description.toLowerCase().includes(searchTerm)
      );
    }

    // Nearby filter (10km radius)
    if (filters.nearby_only && userLocation) {
      filtered = filtered.filter(report => {
        const distance = getDistance(
          userLocation[1], userLocation[0],
          report.latitude, report.longitude
        );
        return distance <= 10000; // 10km in meters
      });
    }

    return filtered;
  }, [reports, filters, userLocation, getDistance]);

  // Get time since reported
  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const reportDate = new Date(dateString);
    const diffInMs = now.getTime() - reportDate.getTime();
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Recently';
  };

  // Get marker color based on status and issue type
  const getMarkerColor = (status: string, issueType: string) => {
    if (status === 'resolved') return '#22c55e'; // green for resolved
    
    // Category-specific colors for pending issues
    switch (issueType) {
      case 'pothole': return '#ef4444'; // red
      case 'wire': return '#f59e0b'; // orange/yellow
      case 'garbage': return '#8b5cf6'; // purple
      case 'water': return '#06b6d4'; // cyan
      default: return '#6b7280'; // gray for other
    }
  };

  // Get marker icon based on issue type
  const getMarkerIcon = (issueType: string) => {
    switch (issueType) {
      case 'pothole': return '🕳️';
      case 'wire': return '⚡';
      case 'garbage': return '🗑️';
      case 'water': return '💧';
      default: return '⚠️';
    }
  };

  // Fetch reports from Supabase with vote counts
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch vote counts separately for each report
      const reportsWithVotes = await Promise.all(
        (data || []).map(async (report) => {
          const { data: voteData } = await supabase.rpc('get_vote_count', { report_id: report.id });
          return { ...report, vote_count: voteData || 0 };
        })
      );
      
      setReports(reportsWithVotes);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(coords);
          
          // Center map on user location
          if (map.current) {
            map.current.setCenter(coords);
            map.current.setZoom(12);
            
            // Add user location marker
            new mapboxgl.Marker({ color: '#3b82f6' })
              .setLngLat(coords)
              .addTo(map.current);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your location. Using default view.",
            variant: "destructive"
          });
        }
      );
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.5, 40], // Default center
      zoom: 9
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update markers when filtered reports change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredReports.forEach(report => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = getMarkerColor(report.status, report.issue_type);
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '14px';
      el.style.transition = 'transform 0.2s';
      
      // Add emoji icon
      el.textContent = getMarkerIcon(report.issue_type);
      
      // Add opacity for resolved issues
      if (report.status === 'resolved') {
        el.style.opacity = '0.7';
      }

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([report.longitude, report.latitude])
        .addTo(map.current!);

      // Add click handler
      el.addEventListener('click', () => {
        setSelectedReport(report);
        map.current!.flyTo({
          center: [report.longitude, report.latitude],
          zoom: 15
        });
      });

      markersRef.current.push(marker);
    });
  }, [filteredReports, map.current]);

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Set up real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Mobile Filter Panel - Fixed */}
      <div className="lg:hidden bg-background border-b p-4 space-y-4 flex-shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={getUserLocation}
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Select value={filters.status} onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.issue_type} onValueChange={(value: any) => setFilters(prev => ({ ...prev, issue_type: value }))}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pothole">Pothole</SelectItem>
              <SelectItem value="wire">Wire</SelectItem>
              <SelectItem value="garbage">Garbage</SelectItem>
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant={filters.nearby_only ? "default" : "outline"}
          onClick={() => setFilters(prev => ({ ...prev, nearby_only: !prev.nearby_only }))}
          className="w-full"
          disabled={!userLocation}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {filters.nearby_only ? 'Showing Nearby' : 'Show Nearby Only'}
        </Button>
      </div>

      {/* Desktop Sidebar - Fixed */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-80 bg-background border-r z-10 flex flex-col">
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <h1 className="text-2xl font-bold">Map View</h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={filters.status} onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Issue Type</label>
            <Select value={filters.issue_type} onValueChange={(value: any) => setFilters(prev => ({ ...prev, issue_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pothole">Pothole</SelectItem>
                <SelectItem value="wire">Wire</SelectItem>
                <SelectItem value="garbage">Garbage</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant={filters.nearby_only ? "default" : "outline"}
            onClick={() => setFilters(prev => ({ ...prev, nearby_only: !prev.nearby_only }))}
            className="w-full"
            disabled={!userLocation}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {filters.nearby_only ? 'Showing Nearby' : 'Show Nearby Only'}
          </Button>
          
          <Button onClick={getUserLocation} variant="outline" className="w-full">
            <Navigation className="h-4 w-4 mr-2" />
            Find My Location
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      </div>

      {/* Map Container - Takes remaining space */}
      <div className="flex-1 relative lg:ml-80 min-h-0">
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        <div ref={mapContainer} className="absolute inset-0" />
      </div>

      {/* Selected Report Popup */}
      {selectedReport && (
        <div className="absolute bottom-4 left-4 right-4 lg:left-80 lg:right-4 z-20">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Mobile Layout - Stacked */}
              <div className="block lg:hidden">
                {/* Image Section - Full Width */}
                {selectedReport.media_url && (
                  <div className="w-full h-32">
                    <img
                      src={selectedReport.media_url}
                      alt={selectedReport.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Content Section - Below Image */}
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-base">{selectedReport.title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedReport.issue_type.replace('_', ' ')}
                      </p>
                    </div>
                    
                    {/* Status and Metrics */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant={selectedReport.status === 'resolved' ? 'default' : 'secondary'}
                        className="capitalize text-xs"
                      >
                        {selectedReport.status}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getTimeSince(selectedReport.created_at)}
                      </div>
                      
                      {selectedReport.vote_count !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ThumbsUp className="h-3 w-3" />
                          {selectedReport.vote_count}
                        </div>
                      )}
                    </div>
                    
                    {/* Description Preview */}
                    {selectedReport.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {selectedReport.description}
                      </p>
                    )}
                    
                    {/* Action Buttons - Full Width */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/report/${selectedReport.id}`)}
                        className="flex-1"
                      >
                        View Full
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReport(null)}
                        className="px-4"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Side by Side */}
              <div className="hidden lg:flex">
                {/* Image Section */}
                {selectedReport.media_url && (
                  <div className="w-32 h-32 flex-shrink-0">
                    <img
                      src={selectedReport.media_url}
                      alt={selectedReport.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Content Section */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{selectedReport.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 capitalize">
                        {selectedReport.issue_type.replace('_', ' ')}
                      </p>
                      
                      {/* Status and Metrics */}
                      <div className="flex items-center gap-3 mb-3">
                        <Badge 
                          variant={selectedReport.status === 'resolved' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {selectedReport.status}
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getTimeSince(selectedReport.created_at)}
                        </div>
                        
                        {selectedReport.vote_count !== undefined && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <ThumbsUp className="h-3 w-3" />
                            {selectedReport.vote_count}
                          </div>
                        )}
                      </div>
                      
                      {/* Description Preview */}
                      {selectedReport.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {selectedReport.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/report/${selectedReport.id}`)}
                        className="whitespace-nowrap"
                      >
                        View Full Report
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReport(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MapView;
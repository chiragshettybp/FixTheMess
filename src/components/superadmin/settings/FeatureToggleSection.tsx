import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ToggleLeft, Trash2 } from 'lucide-react';
import { useSettingsManagement } from '@/hooks/useSettingsManagement';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const FeatureToggleSection: React.FC = () => {
  const { profile } = useAuth();
  const { featureToggles, updateFeatureToggle, loadSettings, isLoading } = useSettingsManagement();
  const { toast } = useToast();
  const [newFeatureKey, setNewFeatureKey] = React.useState('');
  const [newFeatureDescription, setNewFeatureDescription] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleToggleFeature = async (featureKey: string, isEnabled: boolean) => {
    if (!profile?.id) return;
    await updateFeatureToggle(featureKey, isEnabled, profile.id);
  };

  const handleCreateFeature = async () => {
    if (!profile?.id || !newFeatureKey.trim()) return;

    try {
      const { error } = await supabase
        .from('feature_toggles')
        .insert({
          feature_key: newFeatureKey.toLowerCase().replace(/\s+/g, '_'),
          is_enabled: false,
          description: newFeatureDescription.trim() || undefined,
          updated_by: profile.id,
        });

      if (error) throw error;

      await loadSettings();
      setNewFeatureKey('');
      setNewFeatureDescription('');
      setIsDialogOpen(false);

      toast({
        title: "Success",
        description: "Feature toggle created successfully",
      });
    } catch (error) {
      console.error('Error creating feature toggle:', error);
      toast({
        title: "Error",
        description: "Failed to create feature toggle",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFeature = async (featureId: string, featureKey: string) => {
    if (!profile?.id) return;

    if (!confirm(`Are you sure you want to delete the feature toggle "${featureKey}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('feature_toggles')
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      // Log the deletion
      await supabase
        .from('settings_audit')
        .insert({
          admin_id: profile.id,
          action_type: 'DELETE',
          table_name: 'feature_toggles',
          record_id: featureId,
          changes_summary: `Deleted feature toggle: ${featureKey}`,
        });

      await loadSettings();

      toast({
        title: "Success",
        description: "Feature toggle deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting feature toggle:', error);
      toast({
        title: "Error",
        description: "Failed to delete feature toggle",
        variant: "destructive",
      });
    }
  };

  const formatFeatureName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCategoryColor = (key: string) => {
    if (key.includes('notification')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (key.includes('security')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (key.includes('analytics')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (key.includes('user')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5" />
            Feature Toggles
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Feature Toggle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feature_key">Feature Key</Label>
                  <Input
                    id="feature_key"
                    value={newFeatureKey}
                    onChange={(e) => setNewFeatureKey(e.target.value)}
                    placeholder="e.g., advanced_reporting"
                  />
                  <p className="text-sm text-muted-foreground">
                    Use lowercase letters and underscores only
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feature_description">Description (optional)</Label>
                  <Textarea
                    id="feature_description"
                    value={newFeatureDescription}
                    onChange={(e) => setNewFeatureDescription(e.target.value)}
                    placeholder="Brief description of what this feature does..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateFeature}
                    disabled={!newFeatureKey.trim() || isLoading}
                  >
                    Create Feature
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {featureToggles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ToggleLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feature toggles configured</p>
              <p className="text-sm">Create your first feature toggle to get started</p>
            </div>
          ) : (
            featureToggles.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-foreground">
                      {formatFeatureName(feature.feature_key)}
                    </h4>
                    <Badge variant="secondary" className={getCategoryColor(feature.feature_key)}>
                      {feature.feature_key}
                    </Badge>
                    {feature.is_enabled && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        Active
                      </Badge>
                    )}
                  </div>
                  {feature.description && (
                    <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(feature.updated_at).toLocaleDateString()}
                    {feature.updated_by && ` • Updated by admin`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={feature.is_enabled}
                    onCheckedChange={(checked) => handleToggleFeature(feature.feature_key, checked)}
                    disabled={isLoading}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFeature(feature.id, feature.feature_key)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {featureToggles.length > 0 && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h5 className="font-medium text-foreground mb-2">Feature Toggle Tips</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use descriptive names for easy identification</li>
              <li>• Test features thoroughly before enabling in production</li>
              <li>• Document the purpose of each feature toggle</li>
              <li>• Remove obsolete toggles to keep the list clean</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
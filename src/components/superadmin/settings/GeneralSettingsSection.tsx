import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Save, RefreshCw, Settings } from 'lucide-react';
import { useSettingsManagement } from '@/hooks/useSettingsManagement';
import { useAuth } from '@/hooks/useAuth';

const generalSettingsSchema = z.object({
  app_name: z.string().min(1, 'Application name is required'),
  contact_email: z.string().email('Valid email is required'),
  support_phone: z.string().optional(),
  support_website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  organization_name: z.string().optional(),
  privacy_policy_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  terms_of_service_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  app_description: z.string().max(500, 'Description must be under 500 characters').optional(),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

interface GeneralSettingsSectionProps {
  logoPreview: string | null;
  currentLogo: string | null;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoUpload: (file: File) => Promise<string | null>;
}

export const GeneralSettingsSection: React.FC<GeneralSettingsSectionProps> = ({
  logoPreview,
  currentLogo,
  onLogoChange,
  onLogoUpload,
}) => {
  const { profile } = useAuth();
  const { settings, getSettingValue, updateSetting, isLoading } = useSettingsManagement();
  
  const form = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      app_name: getSettingValue('app_name', 'FixTheMess'),
      contact_email: getSettingValue('contact_email', ''),
      support_phone: getSettingValue('support_phone', ''),
      support_website: getSettingValue('support_website', ''),
      organization_name: getSettingValue('organization_name', ''),
      privacy_policy_url: getSettingValue('privacy_policy_url', ''),
      terms_of_service_url: getSettingValue('terms_of_service_url', ''),
      app_description: getSettingValue('app_description', ''),
    },
  });

  // Update form values when settings change
  React.useEffect(() => {
    form.setValue('app_name', getSettingValue('app_name', 'FixTheMess'));
    form.setValue('contact_email', getSettingValue('contact_email', ''));
    form.setValue('support_phone', getSettingValue('support_phone', ''));
    form.setValue('support_website', getSettingValue('support_website', ''));
    form.setValue('organization_name', getSettingValue('organization_name', ''));
    form.setValue('privacy_policy_url', getSettingValue('privacy_policy_url', ''));
    form.setValue('terms_of_service_url', getSettingValue('terms_of_service_url', ''));
    form.setValue('app_description', getSettingValue('app_description', ''));
  }, [settings, getSettingValue, form]);

  const onSubmit = async (data: GeneralSettingsFormData) => {
    if (!profile?.id) return;

    try {
      // Handle logo upload if there's a new file
      const fileInput = document.getElementById('logo') as HTMLInputElement;
      const logoFile = fileInput?.files?.[0];
      
      if (logoFile) {
        const logoUrl = await onLogoUpload(logoFile);
        if (logoUrl) {
          await updateSetting('app_logo', logoUrl, profile.id, 'Application logo');
        }
      }

      // Update all general settings
      const settingsToUpdate = Object.entries(data).filter(([_, value]) => value !== undefined && value !== '');
      
      await Promise.all(
        settingsToUpdate.map(([key, value]) =>
          updateSetting(key, value, profile.id, `General setting: ${key}`)
        )
      );
    } catch (error) {
      console.error('Error updating general settings:', error);
    }
  };

  const resetToDefaults = () => {
    form.reset({
      app_name: 'FixTheMess',
      contact_email: '',
      support_phone: '',
      support_website: '',
      organization_name: '',
      privacy_policy_url: '',
      terms_of_service_url: '',
      app_description: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          General Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="app_name">Application Name *</Label>
              <Input
                id="app_name"
                {...form.register('app_name')}
                placeholder="Enter application name"
              />
              {form.formState.errors.app_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.app_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input
                id="organization_name"
                {...form.register('organization_name')}
                placeholder="Your organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Primary Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                {...form.register('contact_email')}
                placeholder="admin@example.com"
              />
              {form.formState.errors.contact_email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contact_email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="support_phone">Support Phone Number</Label>
              <Input
                id="support_phone"
                {...form.register('support_phone')}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support_website">Support Website</Label>
              <Input
                id="support_website"
                type="url"
                {...form.register('support_website')}
                placeholder="https://support.example.com"
              />
              {form.formState.errors.support_website && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.support_website.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Application Logo</Label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={onLogoChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {(logoPreview || currentLogo) && (
                  <div className="flex items-center gap-4">
                    <img
                      src={logoPreview || currentLogo!}
                      alt="Logo preview"
                      className="h-12 w-12 object-contain rounded border border-border"
                    />
                    <span className="text-sm text-muted-foreground">
                      {logoPreview ? 'New logo preview' : 'Current logo'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
            <Input
              id="privacy_policy_url"
              type="url"
              {...form.register('privacy_policy_url')}
              placeholder="https://example.com/privacy"
            />
            {form.formState.errors.privacy_policy_url && (
              <p className="text-sm text-destructive">
                {form.formState.errors.privacy_policy_url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_of_service_url">Terms of Service URL</Label>
            <Input
              id="terms_of_service_url"
              type="url"
              {...form.register('terms_of_service_url')}
              placeholder="https://example.com/terms"
            />
            {form.formState.errors.terms_of_service_url && (
              <p className="text-sm text-destructive">
                {form.formState.errors.terms_of_service_url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="app_description">Application Description</Label>
            <Textarea
              id="app_description"
              {...form.register('app_description')}
              placeholder="Brief description of your application..."
              rows={3}
            />
            {form.formState.errors.app_description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.app_description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={resetToDefaults}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
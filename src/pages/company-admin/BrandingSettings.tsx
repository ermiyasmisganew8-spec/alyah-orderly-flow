import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface OutletCtx {
  companyId: string;
}

interface CompanyData {
  id: string;
  name: string;
  logo_url: string | null;
  footer_data: {
    address: string;
    phone: string;
    email: string;
    opening_hours: string;
    social_links: Record<string, string>;
    about_text: string;
  };
}

const BrandingSettings = () => {
  const { companyId } = useOutletContext<OutletCtx>();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data as CompanyData;
    },
  });

  const [formData, setFormData] = useState<Partial<CompanyData> | null>(null);

  // Initialize form when company data loads
  if (company && !formData) {
    setFormData(company);
  }

  const updateBrandingMutation = useMutation({
    mutationFn: async (data: Partial<CompanyData>) => {
      const { error } = await supabase
        .from('restaurant_companies')
        .update({
          logo_url: data.logo_url,
          footer_data: data.footer_data,
        })
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast.success('Branding updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update branding');
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `${companyId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      setLogoPreview(urlData.publicUrl);
      setFormData(prev => prev ? { ...prev, logo_url: urlData.publicUrl } : null);
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo');
    }
  };

  if (isLoading || !formData) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Branding Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(logoPreview || formData.logo_url) && (
            <div className="mb-4">
              <img
                src={logoPreview || formData.logo_url || ''}
                alt="Logo preview"
                className="h-24 object-contain"
              />
            </div>
          )}
          <div className="flex items-center gap-4">
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2 cursor-pointer hover:bg-primary/90">
                <Upload className="h-4 w-4" /> Upload Logo
              </div>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </Label>
            {formData.logo_url && (
              <Button
                variant="outline"
                onClick={() => {
                  setFormData(prev => prev ? { ...prev, logo_url: null } : null);
                  setLogoPreview(null);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Address</Label>
            <Input
              value={formData.footer_data?.address || ''}
              onChange={e => setFormData(prev => prev ? {
                ...prev,
                footer_data: { ...prev.footer_data, address: e.target.value }
              } : null)}
              placeholder="123 Main St, City, Country"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.footer_data?.phone || ''}
                onChange={e => setFormData(prev => prev ? {
                  ...prev,
                  footer_data: { ...prev.footer_data, phone: e.target.value }
                } : null)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.footer_data?.email || ''}
                onChange={e => setFormData(prev => prev ? {
                  ...prev,
                  footer_data: { ...prev.footer_data, email: e.target.value }
                } : null)}
                placeholder="info@restaurant.com"
              />
            </div>
          </div>

          <div>
            <Label>Opening Hours</Label>
            <Input
              value={formData.footer_data?.opening_hours || ''}
              onChange={e => setFormData(prev => prev ? {
                ...prev,
                footer_data: { ...prev.footer_data, opening_hours: e.target.value }
              } : null)}
              placeholder="Mon-Sun: 9AM-10PM"
            />
          </div>

          <div>
            <Label>About Text</Label>
            <Textarea
              value={formData.footer_data?.about_text || ''}
              onChange={e => setFormData(prev => prev ? {
                ...prev,
                footer_data: { ...prev.footer_data, about_text: e.target.value }
              } : null)}
              placeholder="Tell your customers about your restaurant"
              rows={4}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => formData && updateBrandingMutation.mutate(formData)}
            disabled={updateBrandingMutation.isPending}
          >
            {updateBrandingMutation.isPending ? 'Saving...' : 'Save Branding'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingSettings;

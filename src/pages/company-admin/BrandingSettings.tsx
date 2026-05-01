import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';


interface FooterData {
  address?: string;
  phone?: string;
  email?: string;
  opening_hours?: string;
  about_text?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_linkedin?: string;
}

interface FormState {
  name: string;
  logo_url: string | null;
  footer_data: FooterData;
}

const BrandingSettings = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-branding', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_companies')
        .select('id, name, logo_url, footer_data, contact_email, phone, location')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const [form, setForm] = useState<FormState>({ name: '', logo_url: null, footer_data: {} });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        logo_url: company.logo_url || null,
        footer_data: (company.footer_data as FooterData) || {},
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('restaurant_companies')
        .update({
          name: form.name,
          logo_url: form.logo_url,
          footer_data: form.footer_data as any,
          phone: form.footer_data.phone || null,
          contact_email: form.footer_data.email || null,
          location: form.footer_data.address || null,
        })
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-branding', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company-info'] });
      queryClient.invalidateQueries({ queryKey: ['company-name', companyId] });
      toast.success('Branding updated successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update branding'),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileName = `${companyId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('company-assets').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo');
    }
  };

  const setFooter = (k: keyof FooterData, v: string) =>
    setForm(prev => ({ ...prev, footer_data: { ...prev.footer_data, [k]: v } }));

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Branding & Footer</h1>

      <Card>
        <CardHeader><CardTitle>Restaurant Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Restaurant Name</Label>
            <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div>
            <Label>Logo</Label>
            {form.logo_url && (
              <div className="my-3"><img src={form.logo_url} alt="Logo" className="h-24 object-contain" /></div>
            )}
            <div className="flex items-center gap-3">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2 hover:bg-primary/90">
                  <Upload className="h-4 w-4" /> Upload Logo
                </div>
                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </Label>
              {form.logo_url && (
                <Button variant="outline" onClick={() => setForm(prev => ({ ...prev, logo_url: null }))}>Remove</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Footer Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Address</Label>
            <Input value={form.footer_data.address || ''} onChange={e => setFooter('address', e.target.value)} placeholder="123 Main St, City" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input value={form.footer_data.phone || ''} onChange={e => setFooter('phone', e.target.value)} placeholder="+251 911 ..." />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.footer_data.email || ''} onChange={e => setFooter('email', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Opening Hours</Label>
            <Input value={form.footer_data.opening_hours || ''} onChange={e => setFooter('opening_hours', e.target.value)} placeholder="Mon-Sun 9AM-10PM" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Facebook URL</Label>
              <Input value={form.footer_data.social_facebook || ''} onChange={e => setFooter('social_facebook', e.target.value)} />
            </div>
            <div>
              <Label>Instagram URL</Label>
              <Input value={form.footer_data.social_instagram || ''} onChange={e => setFooter('social_instagram', e.target.value)} />
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input value={form.footer_data.social_linkedin || ''} onChange={e => setFooter('social_linkedin', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>About Text</Label>
            <Textarea rows={3} value={form.footer_data.about_text || ''} onChange={e => setFooter('about_text', e.target.value)} />
          </div>

          <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Branding'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingSettings;

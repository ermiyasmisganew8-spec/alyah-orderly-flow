import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Building2, Clock } from 'lucide-react';

const CompanyInfo = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ['company-edit', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('restaurant_companies')
        .select('*')
        .eq('id', companyId!)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const [form, setForm] = useState({
    name: '',
    about_story: '',
    values_text: '',
    weekdays: '',
    saturday: '',
    sunday: '',
    phone: '',
    location: '',
    contact_email: '',
  });

  useEffect(() => {
    if (company) {
      const hours = ((company as any).opening_hours || {}) as any;
      setForm({
        name: company.name || '',
        about_story: (company as any).about_story || '',
        values_text: (company as any).values_text || '',
        weekdays: hours.weekdays || '',
        saturday: hours.saturday || '',
        sunday: hours.sunday || '',
        phone: (company as any).phone || '',
        location: (company as any).location || '',
        contact_email: company.contact_email || '',
      });
    }
  }, [company]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('restaurant_companies')
        .update({
          name: form.name,
          about_story: form.about_story,
          values_text: form.values_text,
          opening_hours: {
            weekdays: form.weekdays || '7:00 AM – 10:00 PM',
            saturday: form.saturday || '8:00 AM – 11:00 PM',
            sunday: form.sunday || '8:00 AM – 9:00 PM',
          },
          phone: form.phone || null,
          location: form.location || null,
          contact_email: form.contact_email || null,
        } as any)
        .eq('id', companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-edit'] });
      queryClient.invalidateQueries({ queryKey: ['company-info'] });
      queryClient.invalidateQueries({ queryKey: ['company-name'] });
      toast.success('Company info updated!');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" /> Company Info
        </h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-6 max-w-3xl"
      >
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <Label>About Story</Label>
              <Textarea
                value={form.about_story}
                onChange={(e) => setForm((f) => ({ ...f, about_story: e.target.value }))}
                rows={6}
                placeholder="Tell customers about your restaurant. Use blank lines to separate paragraphs."
              />
            </div>
            <div>
              <Label>Values (separate with • or comma)</Label>
              <Input
                value={form.values_text}
                onChange={(e) => setForm((f) => ({ ...f, values_text: e.target.value }))}
                placeholder="Authenticity • Community • Quality • Freshness"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" /> Opening Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Mon – Fri</Label>
              <Input value={form.weekdays} onChange={(e) => setForm((f) => ({ ...f, weekdays: e.target.value }))} placeholder="7:00 AM – 10:00 PM" />
            </div>
            <div>
              <Label>Saturday</Label>
              <Input value={form.saturday} onChange={(e) => setForm((f) => ({ ...f, saturday: e.target.value }))} placeholder="8:00 AM – 11:00 PM" />
            </div>
            <div>
              <Label>Sunday</Label>
              <Input value={form.sunday} onChange={(e) => setForm((f) => ({ ...f, sunday: e.target.value }))} placeholder="8:00 AM – 9:00 PM" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Location / Address</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Public Email</Label>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={save.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" /> {save.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
};

export default CompanyInfo;

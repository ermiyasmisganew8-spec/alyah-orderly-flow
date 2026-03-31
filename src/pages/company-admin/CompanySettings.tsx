import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const CompanySettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', email: user?.email || '', phone: '' });
  const [company, setCompany] = useState({ name: 'Canoe Ethiopian Café', contact_email: 'info@canoe.et', address: '123 in front of poly campus, Bahir Dar' });
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });

  const handleSaveProfile = async () => {
    const { error } = await supabase.from('profiles').update({ full_name: profile.full_name, phone: profile.phone }).eq('user_id', user!.id);
    if (error) toast.error('Failed'); else toast.success('Profile updated');
  };

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    if (error) toast.error(error.message); else { toast.success('Password changed'); setPasswords({ newPass: '', confirm: '' }); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-bold mb-6">Settings</h1>
      <Card className="shadow-card border-0 mb-6">
        <CardHeader><CardTitle className="font-display text-lg">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Full Name</Label><Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} /></div>
          <div><Label>Email</Label><Input value={profile.email} disabled className="bg-muted" /></div>
          <Button onClick={handleSaveProfile}>Save</Button>
        </CardContent>
      </Card>
      <Card className="shadow-card border-0 mb-6">
        <CardHeader><CardTitle className="font-display text-lg">Company Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Company Name</Label><Input value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} /></div>
          <div><Label>Contact Email</Label><Input value={company.contact_email} onChange={e => setCompany(c => ({ ...c, contact_email: e.target.value }))} /></div>
          <div><Label>Address</Label><Input value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} /></div>
          <Button onClick={() => toast.success('Company details saved (simulated)')}>Save</Button>
        </CardContent>
      </Card>
      <Card className="shadow-card border-0 mb-6">
        <CardHeader><CardTitle className="font-display text-lg">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>New Password</Label><Input type="password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} /></div>
          <div><Label>Confirm</Label><Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} /></div>
          <Button onClick={handleChangePassword}>Change Password</Button>
        </CardContent>
      </Card>
      <Card className="shadow-card border-0">
        <CardHeader><CardTitle className="font-display text-lg">Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label>Two-Factor Authentication</Label><Switch /></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySettings;

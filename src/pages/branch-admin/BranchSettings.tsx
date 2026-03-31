import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const BranchSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', email: user?.email || '', phone: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        phone: profile.phone,
      }).eq('user_id', user!.id);
      if (error) throw error;
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    if (error) toast.error(error.message);
    else {
      toast.success('Password changed');
      setPasswords({ current: '', newPass: '', confirm: '' });
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-bold mb-6">Settings</h1>

      <Card className="shadow-card border-0 mb-6">
        <CardHeader><CardTitle className="font-display text-lg">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Full Name</Label><Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} /></div>
          <div><Label>Email</Label><Input value={profile.email} disabled className="bg-muted" /></div>
          <div><Label>Phone</Label><Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} /></div>
          <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0 mb-6">
        <CardHeader><CardTitle className="font-display text-lg">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>New Password</Label><Input type="password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} /></div>
          <div><Label>Confirm Password</Label><Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} /></div>
          <Button onClick={handleChangePassword}>Change Password</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader><CardTitle className="font-display text-lg">Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Two-Factor Authentication</Label>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <Label>Email Notifications</Label>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchSettings;

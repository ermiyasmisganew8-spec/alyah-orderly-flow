import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const cardStyle = { background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' };

const PlatformProfile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setFullName(data?.full_name || ''));
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error: pErr } = await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
      if (pErr) throw pErr;
      if (email && email !== user.email) {
        const { error: eErr } = await supabase.auth.updateUser({ email });
        if (eErr) throw eErr;
      }
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password changed');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display font-bold">My Profile</h1>

      <Card style={cardStyle} className="border-0">
        <CardHeader><CardTitle className="text-sm font-display">Account Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <Button onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      <Card style={cardStyle} className="border-0">
        <CardHeader><CardTitle className="text-sm font-display">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} />
          </div>
          <Button onClick={changePassword} disabled={savingPassword || !newPassword}>
            {savingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformProfile;

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const StaffSettings = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [orderNotif, setOrderNotif] = useState(true);
  const [soundNotif, setSoundNotif] = useState(true);

  const handleProfileSave = async () => {
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('user_id', user!.id);
    if (error) toast.error('Failed to update profile');
    else toast.success('Profile updated');
  };

  const handlePasswordChange = async () => {
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }
    if (newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) toast.error(error.message);
    else { toast.success('Password changed'); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display font-bold">Settings</h1>

      <Card className="shadow-card border-0">
        <CardHeader><CardTitle className="font-display">Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
          <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251..." /></div>
          <Button onClick={handleProfileSave}>Save Profile</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader><CardTitle className="font-display">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Current Password</Label><Input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} /></div>
          <div><Label>New Password</Label><Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} /></div>
          <div><Label>Confirm New Password</Label><Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} /></div>
          <Button onClick={handlePasswordChange}>Change Password</Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader><CardTitle className="font-display">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>New Order Notifications</Label>
            <Switch checked={orderNotif} onCheckedChange={setOrderNotif} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Sound Alerts</Label>
            <Switch checked={soundNotif} onCheckedChange={setSoundNotif} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0 border-destructive/20">
        <CardHeader><CardTitle className="font-display text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Deactivating your account will prevent you from logging in.</p>
          <Button variant="destructive" onClick={() => toast.info('Please contact your branch admin to deactivate your account.')}>
            Deactivate Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffSettings;

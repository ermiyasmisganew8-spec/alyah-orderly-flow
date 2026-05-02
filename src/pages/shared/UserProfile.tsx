import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';

interface Props {
  title?: string;
}

const UserProfile = ({ title = 'My Profile' }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', avatar_url: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
        });
      } else {
        setProfile(p => ({ ...p, email: user.email || '' }));
      }
      setLoading(false);
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('company-assets').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(path);
      const url = urlData.publicUrl;
      setProfile(p => ({ ...p, avatar_url: url }));
      await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display font-bold">{title}</h1>

      <Card className="shadow-card border-0">
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>{profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Change Avatar'}
              </Button>
            </div>
          </div>
          <div>
            <Label>Full Name</Label>
            <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile.email} readOnly disabled />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} />
          </div>
          <Button onClick={changePassword} disabled={pwSaving || !newPassword}>
            {pwSaving ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, UserX, Pencil } from 'lucide-react';

interface StaffCred {
  email: string;
  password: string;
}

const BranchStaff = () => {
  const { branchId, companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', staff_position: 'waiter', is_active: true });
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', staff_position: 'waiter' });
  const [staffCreds, setStaffCreds] = useState<Record<string, StaffCred>>({});

  const { data: staffRoles } = useQuery({
    queryKey: ['branch-staff', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('*')
        .eq('branch_id', branchId!)
        .eq('role', 'staff');
      return data || [];
    },
    enabled: !!branchId,
  });

  const userIds = useMemo(
    () => (staffRoles || []).map((r: any) => r.user_id).filter(Boolean),
    [staffRoles]
  );

  const { data: staffProfiles } = useQuery({
    queryKey: ['branch-staff-profiles', userIds.join(',')],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, is_active')
        .in('user_id', userIds);
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const profileFor = (uid: string) => staffProfiles?.find((p: any) => p.user_id === uid);

  const addStaff = useMutation({
    mutationFn: async () => {
      // Use edge function to create user without affecting current session
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: 'staff',
          branch_id: branchId,
          company_id: companyId,
          staff_position: form.staff_position,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update phone if provided
      if (form.phone && data?.user_id) {
        await supabase.from('profiles').update({ phone: form.phone }).eq('user_id', data.user_id);
      }

      // Store credentials for tooltip
      if (data?.user_id) {
        setStaffCreds(prev => ({ ...prev, [data.user_id]: { email: form.email, password: form.password } }));
      }

      // Send credential email
      try {
        await supabase.functions.invoke('send-credential-email', {
          body: { to: form.email, name: form.full_name, email: form.email, password: form.password, role: 'Staff' },
        });
      } catch { /* demo logging */ }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-staff'] });
      toast.success('Staff member added!');
      setIsOpen(false);
      setForm({ full_name: '', email: '', phone: '', password: '', staff_position: 'waiter' });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add staff'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_active: !isActive }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-staff'] });
      toast.success('Staff status updated');
    },
  });

  return (
    <TooltipProvider>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Staff Management</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Staff</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add Staff Member</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addStaff.mutate(); }} className="space-y-4">
                <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div>
                  <Label>Position</Label>
                  <Select value={form.staff_position} onValueChange={v => setForm(f => ({ ...f, staff_position: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="chief">Chief</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Waiters and chiefs see only their tips; only managers see the orders dashboard.</p>
                </div>
                <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} /></div>
                <Button type="submit" className="w-full" disabled={addStaff.isPending}>{addStaff.isPending ? 'Adding...' : 'Add Staff'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card border-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground bg-muted/50">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Position</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffRoles?.map((sr: any) => {
                    const cred = staffCreds[sr.user_id];
                    const profile = profileFor(sr.user_id);
                    const row = (
                      <tr key={sr.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">{profile?.full_name || '—'}</td>
                        <td className="p-3 text-muted-foreground">{profile?.email || '—'}</td>
                        <td className="p-3 capitalize text-muted-foreground">{sr.staff_position || 'waiter'}</td>
                        <td className="p-3 text-muted-foreground">{profile?.phone || '—'}</td>
                        <td className="p-3">
                          <Badge variant={profile?.is_active ? 'default' : 'secondary'}>
                            {profile?.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm" onClick={() => toggleActive.mutate({ userId: sr.user_id, isActive: !!profile?.is_active })}>
                            <UserX className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                    if (cred) {
                      return (
                        <Tooltip key={sr.id}>
                          <TooltipTrigger asChild>{row}</TooltipTrigger>
                          <TooltipContent><p className="text-xs">Email: {cred.email}<br/>Password: {cred.password}</p></TooltipContent>
                        </Tooltip>
                      );
                    }
                    return row;
                  })}
                  {(!staffRoles || staffRoles.length === 0) && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No staff members yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default BranchStaff;

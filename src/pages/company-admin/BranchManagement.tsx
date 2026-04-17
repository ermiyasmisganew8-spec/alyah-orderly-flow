import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, UserPlus } from 'lucide-react';

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const BranchManagement = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [credModal, setCredModal] = useState<{ email: string; password: string; branchName: string } | null>(null);

  const initialForm = {
    name: '',
    location: '',
    create_admin: true,
    admin_full_name: '',
    admin_email: '',
    admin_password: generatePassword(),
  };
  const [form, setForm] = useState(initialForm);

  const { data: branches } = useQuery({
    queryKey: ['company-branches-mgmt', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('restaurant_branches').select('*').eq('company_id', companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editItem) {
        const { error } = await supabase
          .from('restaurant_branches')
          .update({ name: form.name, location: form.location || null })
          .eq('id', editItem.id);
        if (error) throw error;
        return null;
      }

      // Create branch
      const { data: branch, error: brErr } = await supabase
        .from('restaurant_branches')
        .insert({ company_id: companyId!, name: form.name, location: form.location || null })
        .select()
        .single();
      if (brErr) throw brErr;

      // Optionally create branch admin
      if (form.create_admin && form.admin_email && form.admin_password) {
        const { data, error: fnErr } = await supabase.functions.invoke('create-admin-user', {
          body: {
            email: form.admin_email,
            password: form.admin_password,
            full_name: form.admin_full_name || form.admin_email,
            role: 'branch_admin',
            company_id: companyId,
            branch_id: branch.id,
          },
        });
        if (fnErr) throw fnErr;
        if (data?.error) throw new Error(data.error);

        // Send credential email (best-effort)
        try {
          await supabase.functions.invoke('send-credential-email', {
            body: {
              to: form.admin_email,
              name: form.admin_full_name || form.admin_email,
              email: form.admin_email,
              password: form.admin_password,
              role: 'Branch Admin',
            },
          });
        } catch { /* demo only */ }

        return { email: form.admin_email, password: form.admin_password, branchName: form.name };
      }
      return null;
    },
    onSuccess: (cred) => {
      queryClient.invalidateQueries({ queryKey: ['company-branches-mgmt'] });
      queryClient.invalidateQueries({ queryKey: ['branch-admins'] });
      toast.success(editItem ? 'Branch updated!' : 'Branch added!');
      setIsOpen(false);
      resetForm();
      if (cred) setCredModal(cred);
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'suspended' : 'active';
      const { error } = await supabase.from('restaurant_branches').update({ status: newStatus as any }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-branches-mgmt'] });
      toast.success('Status updated');
    },
  });

  const resetForm = () => {
    setForm({ ...initialForm, admin_password: generatePassword() });
    setEditItem(null);
  };
  const openEdit = (b: any) => {
    setEditItem(b);
    setForm({ ...initialForm, name: b.name, location: b.location || '', create_admin: false });
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Branch Management</h1>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Branch</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">{editItem ? 'Edit Branch' : 'Add Branch'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div>
                <Label>Branch Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>

              {!editItem && (
                <>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Switch
                      id="create-admin"
                      checked={form.create_admin}
                      onCheckedChange={(v) => setForm(f => ({ ...f, create_admin: v }))}
                    />
                    <Label htmlFor="create-admin" className="cursor-pointer flex items-center gap-2">
                      <UserPlus className="h-4 w-4" /> Create branch admin for this branch
                    </Label>
                  </div>

                  {form.create_admin && (
                    <div className="space-y-4 pl-6 border-l-2 border-primary/30">
                      <div>
                        <Label>Admin Full Name</Label>
                        <Input
                          value={form.admin_full_name}
                          onChange={e => setForm(f => ({ ...f, admin_full_name: e.target.value }))}
                          required={form.create_admin}
                        />
                      </div>
                      <div>
                        <Label>Admin Email</Label>
                        <Input
                          type="email"
                          value={form.admin_email}
                          onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))}
                          required={form.create_admin}
                        />
                      </div>
                      <div>
                        <Label>Temporary Password</Label>
                        <div className="flex gap-2">
                          <Input
                            value={form.admin_password}
                            onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))}
                            required={form.create_admin}
                            minLength={6}
                          />
                          <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, admin_password: generatePassword() }))}>
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : editItem ? 'Update Branch' : 'Add Branch'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials modal */}
      <Dialog open={!!credModal} onOpenChange={() => setCredModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Branch Admin Credentials</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Branch <strong>{credModal?.branchName}</strong> was created with a branch admin. Share these credentials with them.
          </p>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1">
            <p><span className="text-muted-foreground">Email:</span> {credModal?.email}</p>
            <p><span className="text-muted-foreground">Password:</span> {credModal?.password}</p>
          </div>
          <Button onClick={() => {
            navigator.clipboard.writeText(`Email: ${credModal?.email}\nPassword: ${credModal?.password}`);
            toast.success('Copied!');
          }}>Copy Credentials</Button>
        </DialogContent>
      </Dialog>

      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground bg-muted/50">
                <th className="p-3">Name</th><th className="p-3">Location</th><th className="p-3">Tables</th><th className="p-3">Status</th><th className="p-3">Actions</th>
              </tr></thead>
              <tbody>
                {branches?.map(b => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{b.name}</td>
                    <td className="p-3 text-muted-foreground">{b.location || '—'}</td>
                    <td className="p-3">{b.table_count}</td>
                    <td className="p-3"><Badge variant={b.status === 'active' ? 'default' : 'secondary'} className="capitalize">{b.status}</Badge></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus.mutate({ id: b.id, status: b.status })}>
                          {b.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchManagement;

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Copy, Check } from 'lucide-react';

const cardStyle = { background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' };

const CompanyManagement = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [credentialModal, setCredentialModal] = useState<{ email: string; password: string; companyName: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', contact_email: '', admin_email: '', admin_password: '', admin_name: '' });

  const { data: companies } = useQuery({
    queryKey: ['platform-companies'],
    queryFn: async () => {
      const { data } = await supabase.from('restaurant_companies').select('*');
      return data || [];
    },
  });

  const { data: branches } = useQuery({
    queryKey: ['platform-branches'],
    queryFn: async () => { const { data } = await supabase.from('restaurant_branches').select('*'); return data || []; },
  });

  const { data: orders } = useQuery({
    queryKey: ['platform-all-orders'],
    queryFn: async () => { const { data } = await supabase.from('orders').select('*'); return data || []; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editItem) {
        const { error } = await supabase.from('restaurant_companies').update({
          name: form.name, contact_email: form.contact_email || null,
        }).eq('id', editItem.id);
        if (error) throw error;
      } else {
        // Create company
        const { data: company, error: compErr } = await supabase.from('restaurant_companies').insert({
          name: form.name, contact_email: form.contact_email || null,
        }).select().single();
        if (compErr || !company) throw compErr;

        // Create company admin via edge function if provided
        if (form.admin_email && form.admin_password) {
          const { data, error: fnErr } = await supabase.functions.invoke('create-admin-user', {
            body: {
              email: form.admin_email,
              password: form.admin_password,
              full_name: form.admin_name || form.admin_email,
              role: 'company_admin',
              company_id: company.id,
            },
          });
          if (fnErr) throw fnErr;
          if (data?.error) throw new Error(data.error);

          // Show credentials modal
          setCredentialModal({
            email: form.admin_email,
            password: form.admin_password,
            companyName: form.name,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-companies'] });
      toast.success(editItem ? 'Company updated!' : 'Company added!');
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'suspended' : 'active';
      const { error } = await supabase.from('restaurant_companies').update({ status: newStatus as any }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-companies'] });
      toast.success('Status updated');
    },
  });

  const resetForm = () => { setForm({ name: '', contact_email: '', admin_email: '', admin_password: '', admin_name: '' }); setEditItem(null); };
  const openEdit = (c: any) => { setEditItem(c); setForm({ name: c.name, contact_email: c.contact_email || '', admin_email: '', admin_password: '', admin_name: '' }); setIsOpen(true); };

  const getCompanyStats = (companyId: string) => {
    const cBranches = branches?.filter(b => b.company_id === companyId) || [];
    const branchIds = cBranches.map(b => b.id);
    const rev = orders?.filter(o => branchIds.includes(o.branch_id) && o.status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0) || 0;
    return { branches: cBranches.length, revenue: rev };
  };

  const handleCopyCredentials = () => {
    if (!credentialModal) return;
    navigator.clipboard.writeText(`Email: ${credentialModal.email}\nPassword: ${credentialModal.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Company Management</h1>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Company</Button></DialogTrigger>
          <DialogContent className="dark" style={{ background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)', color: 'hsl(210, 30%, 92%)' }}>
            <DialogHeader><DialogTitle className="font-display">{editItem ? 'Edit Company' : 'Add Company'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div><Label>Company Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
              {!editItem && (<>
                <div className="border-t pt-4" style={{ borderColor: 'hsl(222, 30%, 18%)' }}><p className="text-xs mb-3" style={{ color: 'hsl(210, 15%, 55%)' }}>Company Admin (optional)</p></div>
                <div><Label>Admin Name</Label><Input value={form.admin_name} onChange={e => setForm(f => ({ ...f, admin_name: e.target.value }))} /></div>
                <div><Label>Admin Email</Label><Input type="email" value={form.admin_email} onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))} /></div>
                <div><Label>Admin Password</Label><Input type="password" value={form.admin_password} onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))} minLength={6} /></div>
              </>)}
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{editItem ? 'Update' : 'Add Company'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials Modal */}
      <Dialog open={!!credentialModal} onOpenChange={() => { setCredentialModal(null); setCopied(false); }}>
        <DialogContent className="dark" style={{ background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)', color: 'hsl(210, 30%, 92%)' }}>
          <DialogHeader><DialogTitle className="font-display">Admin Credentials Created</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'hsl(210, 15%, 75%)' }}>
              The company <strong>{credentialModal?.companyName}</strong> has been created with the following admin credentials. Please save them securely.
            </p>
            <div className="rounded-lg p-4" style={{ background: 'hsl(222, 35%, 14%)', border: '1px solid hsl(222, 30%, 22%)' }}>
              <div className="space-y-2 text-sm font-mono">
                <p><span style={{ color: 'hsl(210, 15%, 55%)' }}>Email:</span> {credentialModal?.email}</p>
                <p><span style={{ color: 'hsl(210, 15%, 55%)' }}>Password:</span> {credentialModal?.password}</p>
              </div>
            </div>
            <Button className="w-full" onClick={handleCopyCredentials}>
              {copied ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy Credentials</>}
            </Button>
            <p className="text-xs text-center" style={{ color: 'hsl(210, 15%, 45%)' }}>
              The admin can log in at /login with the Company Admin role.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Card style={cardStyle} className="border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left" style={{ borderColor: 'hsl(222, 30%, 18%)', color: 'hsl(210, 15%, 55%)' }}>
                <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Branches</th><th className="p-3">Revenue</th><th className="p-3">Status</th><th className="p-3">Actions</th>
              </tr></thead>
              <tbody>
                {companies?.map(c => {
                  const stats = getCompanyStats(c.id);
                  return (
                    <tr key={c.id} className="border-b last:border-0" style={{ borderColor: 'hsl(222, 30%, 18%)' }}>
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3" style={{ color: 'hsl(210, 15%, 55%)' }}>{c.contact_email || '—'}</td>
                      <td className="p-3">{stats.branches}</td>
                      <td className="p-3">{stats.revenue} ETB</td>
                      <td className="p-3"><Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="capitalize">{c.status}</Badge></td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus.mutate({ id: c.id, status: c.status })}>
                            {c.status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyManagement;

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface AdminCred {
  email: string;
  password: string;
}

const AdminManagement = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', branch_id: '' });
  const [adminCreds, setAdminCreds] = useState<Record<string, AdminCred>>({});

  const { data: branches } = useQuery({
    queryKey: ['company-branches-list', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('restaurant_branches').select('*').eq('company_id', companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: admins } = useQuery({
    queryKey: ['branch-admins', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('*, profiles!inner(full_name, email, is_active), restaurant_branches(name)')
        .eq('company_id', companyId!)
        .eq('role', 'branch_admin');
      return data || [];
    },
    enabled: !!companyId,
  });

  const addAdmin = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: 'branch_admin',
          company_id: companyId,
          branch_id: form.branch_id || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.user_id) {
        setAdminCreds(prev => ({ ...prev, [data.user_id]: { email: form.email, password: form.password } }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-admins'] });
      toast.success('Branch admin added!');
      setIsOpen(false);
      setForm({ full_name: '', email: '', password: '', branch_id: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <TooltipProvider>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Admin Management</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Branch Admin</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add Branch Admin</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addAdmin.mutate(); }} className="space-y-4">
                <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
                <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} /></div>
                <div><Label>Assign Branch</Label>
                  <Select value={form.branch_id} onValueChange={v => setForm(f => ({ ...f, branch_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={addAdmin.isPending}>{addAdmin.isPending ? 'Adding...' : 'Add Admin'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card border-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground bg-muted/50">
                  <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Branch</th><th className="p-3">Status</th>
                </tr></thead>
                <tbody>
                  {admins?.map((a: any) => {
                    const cred = adminCreds[a.user_id];
                    const row = (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">{a.profiles?.full_name}</td>
                        <td className="p-3 text-muted-foreground">{a.profiles?.email}</td>
                        <td className="p-3">{a.restaurant_branches?.name || '—'}</td>
                        <td className="p-3"><Badge variant={a.profiles?.is_active ? 'default' : 'secondary'}>{a.profiles?.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      </tr>
                    );
                    if (cred) {
                      return (
                        <Tooltip key={a.id}>
                          <TooltipTrigger asChild>{row}</TooltipTrigger>
                          <TooltipContent><p className="text-xs">Email: {cred.email}<br/>Password: {cred.password}</p></TooltipContent>
                        </Tooltip>
                      );
                    }
                    return row;
                  })}
                  {(!admins || admins.length === 0) && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No branch admins</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default AdminManagement;

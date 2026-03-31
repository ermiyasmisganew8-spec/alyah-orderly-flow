import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Eye } from 'lucide-react';

const BranchManagement = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', location: '' });

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
      const payload = { company_id: companyId!, name: form.name, location: form.location || null };
      if (editItem) {
        const { error } = await supabase.from('restaurant_branches').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('restaurant_branches').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-branches-mgmt'] });
      toast.success(editItem ? 'Branch updated!' : 'Branch added!');
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save'),
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

  const resetForm = () => { setForm({ name: '', location: '' }); setEditItem(null); };
  const openEdit = (b: any) => { setEditItem(b); setForm({ name: b.name, location: b.location || '' }); setIsOpen(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Branch Management</h1>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Branch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editItem ? 'Edit Branch' : 'Add Branch'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div><Label>Branch Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{editItem ? 'Update' : 'Add'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

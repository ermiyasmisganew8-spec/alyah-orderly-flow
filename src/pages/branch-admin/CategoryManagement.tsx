import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const CategoryManagement = () => {
  const { branchId } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', sort_order: '0', is_active: true });

  const { data: categories } = useQuery({
    queryKey: ['categories-admin', branchId],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('branch_id', branchId!).order('sort_order');
      return data || [];
    },
    enabled: !!branchId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { branch_id: branchId!, name: form.name, sort_order: parseInt(form.sort_order) || 0, is_active: form.is_active };
      if (editItem) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(editItem ? 'Category updated!' : 'Category created!');
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save category'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Cannot delete category with existing items'),
  });

  const resetForm = () => { setForm({ name: '', sort_order: '0', is_active: true }); setEditItem(null); };

  const openEdit = (cat: any) => {
    setEditItem(cat);
    setForm({ name: cat.name, sort_order: String(cat.sort_order), is_active: cat.is_active });
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Category Management</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editItem ? 'Edit Category' : 'Add New Category'}</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><Label>Display Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
              </Button>
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
                  <th className="p-3">Order</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories?.map(cat => (
                  <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{cat.name}</td>
                    <td className="p-3">{cat.sort_order}</td>
                    <td className="p-3">{cat.is_active ? '✅ Active' : '❌ Inactive'}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(cat.id)}><Trash2 className="h-3 w-3" /></Button>
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

export default CategoryManagement;

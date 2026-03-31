import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const MenuManagement = () => {
  const { branchId } = useAuth();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', category_id: '', price: '', image_url: '', prep_time_minutes: '15', is_available: true,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', branchId],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('branch_id', branchId!).order('sort_order');
      return data || [];
    },
    enabled: !!branchId,
  });

  const { data: items } = useQuery({
    queryKey: ['menuItems-admin', branchId],
    queryFn: async () => {
      const { data } = await supabase.from('menu_items').select('*, categories(name)').eq('branch_id', branchId!);
      return data || [];
    },
    enabled: !!branchId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        branch_id: branchId!,
        name: form.name,
        description: form.description || null,
        category_id: form.category_id,
        price: parseFloat(form.price),
        image_url: form.image_url || null,
        prep_time_minutes: parseInt(form.prep_time_minutes) || 15,
        is_available: form.is_available,
      };
      if (editItem) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu_items').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems-admin'] });
      toast.success(editItem ? 'Item updated!' : 'Item created!');
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems-admin'] });
      toast.success('Item deleted');
    },
  });

  const resetForm = () => {
    setForm({ name: '', description: '', category_id: '', price: '', image_url: '', prep_time_minutes: '15', is_available: true });
    setEditItem(null);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      category_id: item.category_id,
      price: String(item.price),
      image_url: item.image_url || '',
      prep_time_minutes: String(item.prep_time_minutes || 15),
      is_available: item.is_available,
    });
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Menu Management</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">{editItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price (ETB)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required /></div>
                <div><Label>Prep Time (min)</Label><Input type="number" value={form.prep_time_minutes} onChange={e => setForm(f => ({ ...f, prep_time_minutes: e.target.value }))} /></div>
              </div>
              <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_available} onCheckedChange={v => setForm(f => ({ ...f, is_available: v }))} />
                <Label>Available</Label>
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
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items?.map(item => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 text-muted-foreground">{(item as any).categories?.name}</td>
                    <td className="p-3">{item.price} ETB</td>
                    <td className="p-3">{item.is_available ? '✅ Available' : '❌ Unavailable'}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-3 w-3" /></Button>
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

export default MenuManagement;

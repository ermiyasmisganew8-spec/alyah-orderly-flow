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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';

const BranchPromotions = () => {
  const { branchId } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    title: '', description: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', is_active: true,
  });

  const { data: promotions } = useQuery({
    queryKey: ['branch-promotions', branchId],
    queryFn: async () => {
      const { data } = await supabase.from('promotions').select('*').eq('branch_id', branchId!).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!branchId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        branch_id: branchId!,
        title: form.title,
        description: form.description || null,
        discount_type: form.discount_type as any,
        discount_value: parseFloat(form.discount_value),
        start_date: form.start_date,
        end_date: form.end_date || null,
        is_active: form.is_active,
      };
      if (editItem) {
        const { error } = await supabase.from('promotions').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('promotions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-promotions'] });
      toast.success(editItem ? 'Promotion updated!' : 'Promotion created!');
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-promotions'] });
      toast.success('Promotion deleted');
    },
  });

  const resetForm = () => {
    setForm({ title: '', description: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', is_active: true });
    setEditItem(null);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      title: item.title, description: item.description || '', discount_type: item.discount_type,
      discount_value: String(item.discount_value), start_date: item.start_date, end_date: item.end_date || '', is_active: item.is_active,
    });
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Promotions</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create Promotion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">{editItem ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Discount Type</Label>
                  <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="bogo">BOGO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Discount Value</Label><Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required /></div>
                <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
              </div>
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions?.map(p => (
          <Card key={p.id} className="shadow-card border-0 overflow-hidden">
            <div className={`h-2 ${p.is_active ? 'bg-hero-gradient' : 'bg-muted'}`} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge>{p.discount_type === 'percentage' ? `${p.discount_value}%` : p.discount_type === 'bogo' ? 'BOGO' : `${p.discount_value} ETB`}</Badge>
                <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <h3 className="font-semibold mb-1">{p.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{p.description}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <Calendar className="h-3 w-3" />
                {p.start_date} – {p.end_date || 'Ongoing'}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BranchPromotions;

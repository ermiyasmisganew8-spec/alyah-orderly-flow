import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  features: string[];
  monthly_price: number;
  yearly_price: number;
  is_active: boolean;
  display_order: number;
}

const cardStyle = { background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' };

const PackagesManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [formData, setFormData] = useState<Partial<Package>>({
    name: '', features: [], monthly_price: 0, yearly_price: 0, is_active: true, display_order: 0,
  });
  const [featureInput, setFeatureInput] = useState('');
  const queryClient = useQueryClient();

  const { data: packages = [] } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('packages').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      })) as Package[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name!,
        features: formData.features || [],
        monthly_price: Number(formData.monthly_price) || 0,
        yearly_price: Number(formData.yearly_price) || 0,
        is_active: formData.is_active ?? true,
        display_order: Number(formData.display_order) || 0,
      };
      if (editing) {
        const { error } = await supabase.from('packages').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('packages').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success(editing ? 'Package updated' : 'Package created');
      resetForm();
      setShowModal(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Delete failed'),
  });

  const resetForm = () => {
    setFormData({ name: '', features: [], monthly_price: 0, yearly_price: 0, is_active: true, display_order: 0 });
    setEditing(null);
    setFeatureInput('');
  };

  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    setFormData(pkg);
    setShowModal(true);
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({ ...prev, features: [...(prev.features || []), featureInput.trim()] }));
      setFeatureInput('');
    }
  };

  const removeFeature = (i: number) => {
    setFormData(prev => ({ ...prev, features: (prev.features || []).filter((_, idx) => idx !== i) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Subscription Packages</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Package
        </Button>
      </div>

      <Card style={cardStyle} className="border-0">
        <CardHeader><CardTitle className="text-sm">Packages ({packages.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Yearly</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map(pkg => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-semibold">{pkg.name}</TableCell>
                  <TableCell>{pkg.monthly_price} ETB</TableCell>
                  <TableCell>{pkg.yearly_price} ETB</TableCell>
                  <TableCell>{pkg.features.length} features</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs ${pkg.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>{pkg.display_order}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(pkg)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(pkg.id)}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {packages.length === 0 && <p className="text-center py-8" style={{ color: 'hsl(210, 15%, 55%)' }}>No packages yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Package' : 'Create Package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Package Name</Label>
              <Input value={formData.name || ''} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Basic" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Price (ETB)</Label>
                <Input type="number" step="1" min="0" value={formData.monthly_price ?? ''} onChange={e => setFormData(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Yearly Price (ETB)</Label>
                <Input type="number" step="1" min="0" value={formData.yearly_price ?? ''} onChange={e => setFormData(prev => ({ ...prev, yearly_price: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" min="0" value={formData.display_order ?? ''} onChange={e => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>Features</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={e => setFeatureInput(e.target.value)}
                    placeholder="Add a feature"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                  />
                  <Button type="button" onClick={addFeature} size="sm">Add</Button>
                </div>
                <div className="space-y-1">
                  {(formData.features || []).map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted px-3 py-2 rounded text-sm">
                      <span>{f}</span>
                      <button onClick={() => removeFeature(i)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active ?? true} onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))} />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formData.name}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Package' : 'Create Package'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackagesManagement;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, CreditCard as Edit, Trash2 } from 'lucide-react';

interface Package {
  id: number;
  name: string;
  features: string[];
  monthly_price: number;
  yearly_price: number;
  is_active: boolean;
  display_order: number;
}

const PackagesManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<Partial<Package>>({
    name: '',
    features: [],
    monthly_price: 0,
    yearly_price: 0,
    is_active: true,
    display_order: 0,
  });
  const [featureInput, setFeatureInput] = useState('');
  const queryClient = useQueryClient();

  const { data: packages = [] } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Package[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('packages').insert({
        name: formData.name,
        features: formData.features || [],
        monthly_price: formData.monthly_price,
        yearly_price: formData.yearly_price,
        is_active: formData.is_active,
        display_order: formData.display_order,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package created');
      resetForm();
      setShowModal(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create package');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('packages')
        .update({
          name: formData.name,
          features: formData.features || [],
          monthly_price: formData.monthly_price,
          yearly_price: formData.yearly_price,
          is_active: formData.is_active,
          display_order: formData.display_order,
        })
        .eq('id', editingPackage?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package updated');
      resetForm();
      setShowModal(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update package');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete package');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      features: [],
      monthly_price: 0,
      yearly_price: 0,
      is_active: true,
      display_order: 0,
    });
    setEditingPackage(null);
    setFeatureInput('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData(pkg);
    setShowModal(true);
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscription Packages</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> New Package
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Packages ({packages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>Yearly Price</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map(pkg => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-semibold">{pkg.name}</TableCell>
                  <TableCell>${pkg.monthly_price.toFixed(2)}</TableCell>
                  <TableCell>${pkg.yearly_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {(pkg.features || []).length} features
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      pkg.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(pkg)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(pkg.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {packages.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No packages yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Package Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Package' : 'Create Package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Package Name</Label>
              <Input
                value={formData.name || ''}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Starter, Professional, Enterprise"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_price || ''}
                  onChange={e => setFormData(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Yearly Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.yearly_price || ''}
                  onChange={e => setFormData(prev => ({ ...prev, yearly_price: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                min="0"
                value={formData.display_order || ''}
                onChange={e => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Features</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={e => setFeatureInput(e.target.value)}
                    placeholder="Add a feature"
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <Button onClick={addFeature} size="sm">Add</Button>
                </div>
                <div className="space-y-2">
                  {(formData.features || []).map((feature, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                      <span>{feature}</span>
                      <button
                        onClick={() => removeFeature(i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>

            <Button
              className="w-full"
              onClick={() => editingPackage ? updateMutation.mutate() : createMutation.mutate()}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingPackage ? 'Update Package' : 'Create Package'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackagesManagement;

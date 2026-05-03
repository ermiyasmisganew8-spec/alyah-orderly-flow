import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload, X, ImageIcon } from 'lucide-react';

const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

const MenuManagement = () => {
  const { branchId } = useAuth();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', category_id: '', price: '', image_url: '', prep_time_minutes: '15', is_available: true, ingredients: '',
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
        ingredients: form.ingredients || null,
      } as any;
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
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
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
    setForm({ name: '', description: '', category_id: '', price: '', image_url: '', prep_time_minutes: '15', is_available: true, ingredients: '' });
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
      ingredients: item.ingredients || '',
    });
    setIsOpen(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !branchId) return;

    if (!ALLOWED.includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, or WebP images are allowed');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${branchId}/${editItem?.id || 'new'}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('menu-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = () => setForm((f) => ({ ...f, image_url: '' }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Menu Management</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div>
                <Label>Category</Label>
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

              {/* Image Upload */}
              <div>
                <Label>Item Image</Label>
                <div className="mt-2 space-y-2">
                  {form.image_url ? (
                    <div className="relative inline-block">
                      <img src={form.image_url} alt="preview" className="w-32 h-32 object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground mb-2">JPG, PNG, GIF or WebP (max 5 MB)</p>
                    </div>
                  )}
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFile}
                      className="hidden"
                      disabled={uploading}
                    />
                    <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border bg-background hover:bg-muted cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="h-3 w-3" /> {uploading ? 'Uploading…' : form.image_url ? 'Replace Image' : 'Upload Image'}
                    </span>
                  </label>
                </div>
                <div className="mt-3">
                  <Label className="text-xs">Or paste an Image URL</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={form.image_url}
                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Ingredients</Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Tomato, Onion, Garlic, Olive Oil, Basil"
                  value={form.ingredients}
                  onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated list shown to customers.</p>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={form.is_available} onCheckedChange={v => setForm(f => ({ ...f, is_available: v }))} />
                <Label>Available</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending || uploading}>
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
                  <th className="p-3 w-16">Image</th>
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
                    <td className="p-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
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

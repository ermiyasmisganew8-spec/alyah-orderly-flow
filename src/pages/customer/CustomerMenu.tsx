import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface OutletCtx {
  branchId: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  prep_time_minutes: number | null;
  category_id: string;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
}

const CustomerMenu = () => {
  const { branchId } = useOutletContext<OutletCtx>();
  const { addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ['categories', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menuItems', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_available', true);
      return data || [];
    },
  });

  const filtered = activeCategory
    ? menuItems?.filter(i => i.category_id === activeCategory)
    : menuItems;

  const handleAddToCart = (item: MenuItem, qty: number = 1) => {
    for (let i = 0; i < qty; i++) {
      addItem({ id: item.id, name: item.name, price: item.price, image_url: item.image_url });
    }
    toast.success(`${item.name} added to cart`);
    setSelectedItem(null);
    setQuantity(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold mb-2">Our Menu</h1>
      <p className="text-muted-foreground mb-8">Discover authentic Ethiopian cuisine</p>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <Button
          variant={activeCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory(null)}
        >
          All
        </Button>
        {categories?.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className="whitespace-nowrap"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered?.map(item => (
          <Card
            key={item.id}
            className="shadow-card hover:shadow-warm transition-all cursor-pointer border-0 overflow-hidden group"
            onClick={() => { setSelectedItem(item); setQuantity(1); }}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={item.image_url || '/placeholder.svg'}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm mb-1 line-clamp-1">{item.name}</h3>
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary text-sm">{item.price} ETB</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <img
                src={selectedItem.image_url || '/placeholder.svg'}
                alt={selectedItem.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
              {(selectedItem as any).ingredients && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Ingredients</p>
                  <p className="text-sm">{(selectedItem as any).ingredients}</p>
                </div>
              )}
              {selectedItem.prep_time_minutes && (
                <Badge variant="secondary">~{selectedItem.prep_time_minutes} min prep</Badge>
              )}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">{selectedItem.price} ETB</span>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold w-6 text-center">{quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => handleAddToCart(selectedItem, quantity)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart — {selectedItem.price * quantity} ETB
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerMenu;

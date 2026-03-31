import { useOutletContext, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface OutletCtx {
  companyId: string;
  branchId: string;
  tableNumber: number;
}

const CustomerCart = () => {
  const { companyId, branchId, tableNumber } = useOutletContext<OutletCtx>();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          branch_id: branchId,
          table_number: tableNumber,
          total_amount: totalPrice,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError || !order) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/b/${companyId}/${branchId}/order/${order.id}?table=${tableNumber}`);
    } catch (err) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some delicious items from our menu</p>
        <Button onClick={() => navigate(`/b/${companyId}/${branchId}/menu?table=${tableNumber}`)}>
          Browse Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-display font-bold mb-2">Your Cart</h1>
      <p className="text-muted-foreground mb-6">Table {tableNumber}</p>

      <div className="space-y-3 mb-6">
        {items.map(item => (
          <Card key={item.id} className="shadow-card border-0">
            <CardContent className="p-4 flex items-center gap-4">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" loading="lazy" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                <p className="text-sm text-primary font-bold">{item.price} ETB</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-display text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold text-primary">{totalPrice} ETB</span>
          </div>
          <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={placing}>
            {placing ? 'Placing Order...' : 'Place Order'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerCart;

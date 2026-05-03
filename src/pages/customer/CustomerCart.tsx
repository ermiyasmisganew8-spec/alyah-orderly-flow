import { useOutletContext, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { setStoredActiveOrder } from '@/hooks/useActiveOrder';
import { useQueryClient } from '@tanstack/react-query';

interface OutletCtx {
  companyId: string;
  branchId: string;
  tableNumber: number;
}

const CustomerCart = () => {
  const { companyId, branchId, tableNumber } = useOutletContext<OutletCtx>();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      // Table lock check: prevent new order if table is already occupied
      const { data: existing, error: checkError } = await supabase
        .from('orders')
        .select('id, customer_id, status')
        .eq('branch_id', branchId)
        .eq('table_number', tableNumber)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError) throw checkError;

      // If there's an existing pending order at this table that belongs to this customer
      // (or matches the stored guest order id), append items to it instead of creating a new order.
      let existingOrderId: string | null = null;
      if (existing) {
        const ownsOrder = user && existing.customer_id === user.id;
        const guestOwns = !user && (() => {
          try {
            const map = JSON.parse(localStorage.getItem('alyah_active_orders') || '{}');
            return map[branchId] === existing.id;
          } catch { return false; }
        })();

        if (existing.status === 'pending' && (ownsOrder || guestOwns)) {
          existingOrderId = existing.id;
        } else if (ownsOrder) {
          toast.info('You already have an active order at this table.');
          navigate(`/b/${companyId}/${branchId}/order/${existing.id}?table=${tableNumber}`);
          return;
        } else {
          toast.error('This table is currently occupied. Please wait until the current order is completed or ask staff for assistance.');
          return;
        }
      }

      if (existingOrderId) {
        // Append items to existing pending order
        const orderItems = items.map(item => ({
          order_id: existingOrderId!,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        // Update total
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('id', existingOrderId)
          .single();
        const newTotal = Number(existingOrder?.total_amount || 0) + totalPrice;
        await supabase.from('orders').update({ total_amount: newTotal }).eq('id', existingOrderId);

        clearCart();
        toast.success('Items added to your order!');
        queryClient.invalidateQueries({ queryKey: ['order', existingOrderId] });
        navigate(`/b/${companyId}/${branchId}/order/${existingOrderId}?table=${tableNumber}`);
        return;
      }

      // Auto-assign a waiter from this branch (round-robin via random pick)
      let assignedStaffId: string | null = null;
      const { data: waiters } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('branch_id', branchId)
        .eq('role', 'staff')
        .eq('staff_position', 'waiter');
      if (waiters && waiters.length > 0) {
        assignedStaffId = waiters[Math.floor(Math.random() * waiters.length)].user_id;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          branch_id: branchId,
          table_number: tableNumber,
          total_amount: totalPrice,
          status: 'pending',
          customer_id: user?.id ?? null,
          staff_id: assignedStaffId,
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

      // Remember active order for guests + logged-in users so the banner can show on other pages
      setStoredActiveOrder(branchId, order.id);
      queryClient.invalidateQueries({ queryKey: ['active-order', branchId] });

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

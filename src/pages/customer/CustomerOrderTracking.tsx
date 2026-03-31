import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useOrderTrackingRealtime } from '@/hooks/useOrderRealtime';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import { CheckCircle, Clock, ChefHat, UtensilsCrossed } from 'lucide-react';

interface OutletCtx {
  branchId: string;
  tableNumber: number;
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  preparing: ChefHat,
  served: UtensilsCrossed,
  paid: CheckCircle,
};

const CustomerOrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { branchId } = useOutletContext<OutletCtx>();

  const { data: order, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name))')
        .eq('id', orderId!)
        .single();
      return data;
    },
  });

  useOrderTrackingRealtime(orderId, [['order', orderId!]]);

  const handlePayment = async () => {
    if (!order) return;
    const { error: payError } = await supabase.from('payments').insert({
      order_id: order.id,
      amount: order.total_amount,
      method: 'cash',
      status: 'completed',
      transaction_ref: `PAY-${Date.now()}`,
    });
    if (!payError) {
      await supabase.from('orders').update({ status: 'paid' as const }).eq('id', order.id);
      toast.success('Payment successful!');
      refetch();
    } else {
      toast.error('Payment failed');
    }
  };

  if (!order) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading order...</div>;
  }

  const steps = ['pending', 'preparing', 'served', 'paid'];
  const currentStep = steps.indexOf(order.status);
  const StatusIcon = statusIcons[order.status] || Clock;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-display font-bold mb-2">Order Tracking</h1>
      <p className="text-muted-foreground mb-8">Order #{order.id.slice(0, 8)}</p>

      {/* Status Progress */}
      <Card className="shadow-card border-0 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-hero-gradient flex items-center justify-center">
              <StatusIcon className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-center font-display text-xl font-semibold mb-4">
            {ORDER_STATUS_LABELS[order.status]}
          </h2>
          <div className="flex justify-between items-center mb-2">
            {steps.map((step, i) => (
              <div key={step} className="flex-1 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${
                    i < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map(s => <span key={s}>{ORDER_STATUS_LABELS[s]}</span>)}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card className="shadow-card border-0 mb-6">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Items</h3>
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.menu_items?.name || 'Item'}</span>
              <span className="font-medium">{item.subtotal} ETB</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">{order.total_amount} ETB</span>
          </div>
        </CardContent>
      </Card>

      {/* Pay Button */}
      {order.status === 'served' && (
        <Button className="w-full" size="lg" onClick={handlePayment}>
          Pay Now — {order.total_amount} ETB
        </Button>
      )}
    </div>
  );
};

export default CustomerOrderTracking;

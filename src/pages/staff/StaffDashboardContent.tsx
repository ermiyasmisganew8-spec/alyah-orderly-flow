import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

const StaffDashboardContent = () => {
  const { branchId } = useAuth();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ['staff-orders', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name))')
        .eq('branch_id', branchId!)
        .in('status', ['pending', 'preparing', 'served'])
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!branchId,
  });

  useOrderRealtime(branchId, [['staff-orders', branchId!]]);

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status: status as any }).eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
      toast.success('Order updated!');
    },
  });

  const pending = orders?.filter(o => o.status === 'pending') || [];
  const preparing = orders?.filter(o => o.status === 'preparing') || [];
  const served = orders?.filter(o => o.status === 'served') || [];

  const filterOrders = (list: typeof orders) =>
    list?.filter(o => search === '' || o.id.includes(search) || o.table_number.toString().includes(search)) || [];

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="shadow-card border-0 mb-3 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-sm">Table {order.table_number}</p>
            <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
          </div>
          <Badge className={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
        </div>
        <div className="space-y-1 mb-3">
          {order.order_items?.slice(0, 3).map((item: any) => (
            <p key={item.id} className="text-xs text-muted-foreground">{item.quantity}x {item.menu_items?.name}</p>
          ))}
          {order.order_items?.length > 3 && <p className="text-xs text-muted-foreground">+{order.order_items.length - 3} more</p>}
        </div>
        <p className="text-sm font-bold text-primary mb-3">{order.total_amount} ETB</p>
        {order.status === 'pending' && (
          <Button size="sm" className="w-full" onClick={() => updateStatus.mutate({ orderId: order.id, status: 'preparing' })}>Mark Preparing</Button>
        )}
        {order.status === 'preparing' && (
          <Button size="sm" className="w-full" onClick={() => updateStatus.mutate({ orderId: order.id, status: 'served' })}>Mark Served</Button>
        )}
        {order.status !== 'paid' && order.status !== 'cancelled' && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(`Free table ${order.table_number}? This cancels the order so a new customer can order.`)) {
                updateStatus.mutate({ orderId: order.id, status: 'cancelled' });
              }
            }}
          >
            Free Table
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Pending', items: filterOrders(pending), color: 'text-warning' },
          { title: 'Preparing', items: filterOrders(preparing), color: 'text-primary' },
          { title: 'Served', items: filterOrders(served), color: 'text-success' },
        ].map(col => (
          <div key={col.title}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className={`font-display text-lg font-semibold ${col.color}`}>{col.title}</h2>
              <Badge variant="secondary">{col.items.length}</Badge>
            </div>
            <div className="space-y-3">
              {col.items.map((o: any) => <OrderCard key={o.id} order={o} />)}
              {col.items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No orders</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffDashboardContent;

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
import { Search, Coins, Users } from 'lucide-react';

const StaffDashboardContent = () => {
  const { branchId, user } = useAuth();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: position } = useQuery({
    queryKey: ['staff-position', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('staff_position')
        .eq('user_id', user!.id)
        .maybeSingle();
      return (data as any)?.staff_position ?? 'waiter';
    },
    enabled: !!user,
  });

  const isManager = position === 'manager';

  // Tables assigned to this waiter
  const { data: myTables } = useQuery({
    queryKey: ['my-tables', user?.id, branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('branch_tables')
        .select('table_number')
        .eq('branch_id', branchId!)
        .eq('assigned_staff_id', user!.id);
      return (data || []).map((t: any) => t.table_number as number);
    },
    enabled: !!user && !!branchId && !isManager && position !== undefined,
  });

  const { data: orders } = useQuery({
    queryKey: ['staff-orders', branchId, isManager ? 'all' : `w-${user?.id}`, (myTables || []).join(',')],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name))')
        .eq('branch_id', branchId!)
        .in('status', ['pending', 'preparing', 'served'])
        .order('created_at', { ascending: false });
      if (!isManager) {
        if (!myTables || myTables.length === 0) return [];
        q = q.in('table_number', myTables);
      }
      const { data } = await q;
      return data || [];
    },
    enabled: !!branchId && position !== undefined && (isManager || myTables !== undefined),
  });

  useOrderRealtime(branchId, [['staff-orders', branchId!]]);

  // Manager tips summary (today)
  const { data: tipsSummary } = useQuery({
    queryKey: ['branch-tips-today', branchId],
    queryFn: async () => {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const { data: branchOrders } = await supabase
        .from('orders').select('id').eq('branch_id', branchId!);
      const ids = (branchOrders || []).map((o: any) => o.id);
      if (ids.length === 0) return { total: 0, byStaff: [] as any[] };
      const { data: tips } = await supabase
        .from('feedback')
        .select('tip_amount, staff_id, created_at')
        .in('order_id', ids)
        .gt('tip_amount', 0)
        .gte('created_at', startOfDay.toISOString());
      const rows = tips || [];
      const total = rows.reduce((s: number, r: any) => s + Number(r.tip_amount || 0), 0);
      const map = new Map<string, { total: number; count: number }>();
      rows.forEach((r: any) => {
        const k = r.staff_id || 'unassigned';
        const cur = map.get(k) || { total: 0, count: 0 };
        cur.total += Number(r.tip_amount || 0);
        cur.count += 1;
        map.set(k, cur);
      });
      const staffIds = Array.from(map.keys()).filter(k => k !== 'unassigned');
      let names: any[] = [];
      if (staffIds.length) {
        const { data } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', staffIds);
        names = data || [];
      }
      const byStaff = Array.from(map.entries()).map(([id, v]) => {
        const p = names.find((n: any) => n.user_id === id);
        return {
          name: id === 'unassigned' ? 'Unassigned' : (p?.full_name || p?.email || id.slice(0, 8)),
          total: v.total,
          count: v.count,
        };
      }).sort((a, b) => b.total - a.total);
      return { total, byStaff };
    },
    enabled: !!branchId && isManager,
    refetchInterval: 30000,
  });

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
        {(order.status === 'pending' || order.status === 'preparing') && (
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

      {isManager && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-card border-0 bg-hero-gradient text-primary-foreground md:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-5 w-5" />
                <p className="text-sm opacity-90">Today's Branch Tips</p>
              </div>
              <p className="text-3xl font-display font-bold">
                {(tipsSummary?.total ?? 0).toFixed(2)} <span className="text-sm font-normal opacity-80">ETB</span>
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0 md:col-span-2">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold">Tips by Waitress (today)</h2>
              </div>
              {(!tipsSummary?.byStaff || tipsSummary.byStaff.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-6">No tips today.</p>
              ) : (
                <ul className="divide-y">
                  {tipsSummary.byStaff.map((s: any, i: number) => (
                    <li key={i} className="px-4 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.count} tip{s.count === 1 ? '' : 's'}</p>
                      </div>
                      <p className="text-base font-bold text-primary">{s.total.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">ETB</span></p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isManager && myTables !== undefined && myTables.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="p-10 text-center text-muted-foreground">
            No tables assigned to you. Please ask your branch admin to assign tables.
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
};

export default StaffDashboardContent;

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, TrendingUp, Star } from 'lucide-react';

const BranchDashboard = () => {
  const { branchId } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ['branch-orders-stats', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('branch_id', branchId!);
      return data || [];
    },
    enabled: !!branchId,
  });

  const todayOrders = orders?.filter(o => {
    const today = new Date().toISOString().split('T')[0];
    return o.created_at.startsWith(today);
  }) || [];

  const totalRevenue = orders?.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0) || 0;
  const todayRevenue = todayOrders.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0);
  const avgOrder = orders?.length ? (totalRevenue / orders.filter(o => o.status === 'paid').length || 0) : 0;

  const kpis = [
    { icon: DollarSign, label: "Today's Revenue", value: `${todayRevenue} ETB`, color: 'text-primary' },
    { icon: ShoppingCart, label: 'Total Orders', value: orders?.length || 0, color: 'text-accent' },
    { icon: TrendingUp, label: 'Total Revenue', value: `${totalRevenue} ETB`, color: 'text-success' },
    { icon: Star, label: 'Avg Order Value', value: `${Math.round(avgOrder)} ETB`, color: 'text-gold' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <Card key={kpi.label} className="shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-lg font-bold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Table</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders?.slice(0, 10).map(o => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                    <td className="py-2">{o.table_number}</td>
                    <td className="py-2 font-medium">{o.total_amount} ETB</td>
                    <td className="py-2 capitalize">{o.status}</td>
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

export default BranchDashboard;

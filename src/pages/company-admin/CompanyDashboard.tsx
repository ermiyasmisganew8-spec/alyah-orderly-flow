import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CompanyDashboard = () => {
  const { companyId } = useAuth();

  const { data: branches } = useQuery({
    queryKey: ['company-branches', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('restaurant_branches').select('*').eq('company_id', companyId!);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: orders } = useQuery({
    queryKey: ['company-orders', companyId],
    queryFn: async () => {
      const branchIds = branches?.map(b => b.id) || [];
      if (branchIds.length === 0) return [];
      const { data } = await supabase.from('orders').select('*').in('branch_id', branchIds);
      return data || [];
    },
    enabled: !!branches && branches.length > 0,
  });

  const totalRevenue = orders?.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0) || 0;
  const avgOrder = orders?.length ? Math.round(totalRevenue / (orders.filter(o => o.status === 'paid').length || 1)) : 0;

  const branchPerf = branches?.map(b => {
    const bOrders = orders?.filter(o => o.branch_id === b.id) || [];
    const bRevenue = bOrders.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0);
    return { name: b.name, orders: bOrders.length, revenue: bRevenue, location: b.location, status: b.status };
  }) || [];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Company Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Building2, label: 'Total Branches', value: branches?.length || 0, color: 'text-primary' },
          { icon: ShoppingCart, label: 'Total Orders', value: orders?.length || 0, color: 'text-accent' },
          { icon: DollarSign, label: 'Total Revenue', value: `${totalRevenue} ETB`, color: 'text-success' },
          { icon: TrendingUp, label: 'Avg Order', value: `${avgOrder} ETB`, color: 'text-gold' },
        ].map(kpi => (
          <Card key={kpi.label} className="shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div><p className="text-xs text-muted-foreground">{kpi.label}</p><p className="text-lg font-bold">{kpi.value}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card border-0">
          <CardHeader><CardTitle className="font-display text-sm">Revenue by Branch</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={branchPerf}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(25, 80%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader><CardTitle className="font-display text-sm">Branch Performance</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground bg-muted/50">
                  <th className="p-3">Branch</th><th className="p-3">Orders</th><th className="p-3">Revenue</th><th className="p-3">Status</th>
                </tr></thead>
                <tbody>
                  {branchPerf.map(b => (
                    <tr key={b.name} className="border-b last:border-0">
                      <td className="p-3 font-medium">{b.name}</td>
                      <td className="p-3">{b.orders}</td>
                      <td className="p-3">{b.revenue} ETB</td>
                      <td className="p-3 capitalize">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDashboard;

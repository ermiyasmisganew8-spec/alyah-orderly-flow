import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, GitBranch, ShoppingCart, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const cardStyle = { background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' };
const textMuted = { color: 'hsl(210, 15%, 55%)' };

const PlatformDashboard = () => {
  const { data: companies } = useQuery({
    queryKey: ['all-companies'],
    queryFn: async () => { const { data } = await supabase.from('restaurant_companies').select('*'); return data || []; },
  });

  const { data: branches } = useQuery({
    queryKey: ['all-branches'],
    queryFn: async () => { const { data } = await supabase.from('restaurant_branches').select('*'); return data || []; },
  });

  const { data: orders } = useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => { const { data } = await supabase.from('orders').select('*'); return data || []; },
  });

  const totalRevenue = orders?.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0) || 0;

  const companyRevenue = companies?.map(c => {
    const companyBranches = branches?.filter(b => b.company_id === c.id) || [];
    const branchIds = companyBranches.map(b => b.id);
    const rev = orders?.filter(o => branchIds.includes(o.branch_id) && o.status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0) || 0;
    const orderCount = orders?.filter(o => branchIds.includes(o.branch_id)).length || 0;
    return { name: c.name.length > 15 ? c.name.slice(0, 15) + '…' : c.name, revenue: rev, orders: orderCount };
  }) || [];

  const kpis = [
    { icon: Building2, label: 'Companies', value: companies?.length || 0 },
    { icon: GitBranch, label: 'Branches', value: branches?.length || 0 },
    { icon: ShoppingCart, label: 'Total Orders', value: orders?.length || 0 },
    { icon: DollarSign, label: 'Total Revenue', value: `${totalRevenue} ETB` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Platform Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <Card key={kpi.label} style={cardStyle} className="border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'hsl(222, 30%, 18%)' }}>
                  <kpi.icon className="h-5 w-5" style={{ color: 'hsl(25, 80%, 50%)' }} />
                </div>
                <div><p className="text-xs" style={textMuted}>{kpi.label}</p><p className="text-lg font-bold">{kpi.value}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card style={cardStyle} className="border-0">
          <CardHeader><CardTitle className="font-display text-sm">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[{ month: 'Mar', revenue: totalRevenue }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(25, 80%, 50%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card style={cardStyle} className="border-0">
          <CardHeader><CardTitle className="font-display text-sm">Orders by Company</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={companyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' }} />
                <Bar dataKey="orders" fill="hsl(25, 80%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformDashboard;

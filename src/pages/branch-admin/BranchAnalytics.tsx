import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['hsl(25, 80%, 45%)', 'hsl(42, 85%, 55%)', 'hsl(145, 35%, 38%)', 'hsl(25, 30%, 60%)', 'hsl(0, 72%, 50%)', 'hsl(210, 40%, 50%)'];

const BranchAnalytics = () => {
  const { branchId } = useAuth();
  const [dateRange, setDateRange] = useState({ start: '2026-01-01', end: '2026-12-31' });

  const { data: orders } = useQuery({
    queryKey: ['analytics-orders', branchId, dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name, category_id, categories(name)))')
        .eq('branch_id', branchId!)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59');
      return data || [];
    },
    enabled: !!branchId,
  });

  const paidOrders = orders?.filter(o => o.status === 'paid') || [];
  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total_amount), 0);

  // Revenue over time (by month)
  const revenueByMonth: Record<string, number> = {};
  paidOrders.forEach(o => {
    const month = o.created_at.substring(0, 7);
    revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(o.total_amount);
  });
  const revenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));

  // Revenue by category
  const categoryRevenue: Record<string, number> = {};
  paidOrders.forEach(o => {
    o.order_items?.forEach((item: any) => {
      const cat = item.menu_items?.categories?.name || 'Unknown';
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + Number(item.subtotal);
    });
  });
  const categoryData = Object.entries(categoryRevenue).map(([name, value]) => ({ name, value }));

  // Top selling items
  const itemSales: Record<string, { name: string; count: number; revenue: number }> = {};
  orders?.forEach(o => {
    o.order_items?.forEach((item: any) => {
      const name = item.menu_items?.name || 'Unknown';
      if (!itemSales[name]) itemSales[name] = { name, count: 0, revenue: 0 };
      itemSales[name].count += item.quantity;
      itemSales[name].revenue += Number(item.subtotal);
    });
  });
  const topItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const exportCSV = () => {
    const rows = [['Order ID', 'Date', 'Table', 'Amount', 'Status']];
    orders?.forEach(o => rows.push([o.id.slice(0, 8), o.created_at.split('T')[0], String(o.table_number), String(o.total_amount), o.status]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'analytics.csv'; a.click();
    toast.success('CSV exported');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold">Financial Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">From</Label>
            <Input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} className="w-36 h-8 text-xs" />
            <Label className="text-xs">To</Label>
            <Input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} className="w-36 h-8 text-xs" />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3 w-3 mr-1" /> CSV</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-card border-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold text-primary">{totalRevenue} ETB</p></CardContent></Card>
        <Card className="shadow-card border-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{orders?.length || 0}</p></CardContent></Card>
        <Card className="shadow-card border-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Order Value</p><p className="text-2xl font-bold">{paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0} ETB</p></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-card border-0">
          <CardHeader><CardTitle className="font-display text-sm">Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(25, 80%, 45%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader><CardTitle className="font-display text-sm">Revenue by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-0">
        <CardHeader><CardTitle className="font-display text-sm">Top Selling Items</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topItems} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="hsl(25, 80%, 45%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchAnalytics;

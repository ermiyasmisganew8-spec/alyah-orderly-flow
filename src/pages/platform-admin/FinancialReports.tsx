import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

const cardStyle = { background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' };

const FinancialReports = () => {
  const [dateRange, setDateRange] = useState({ start: '2026-01-01', end: '2026-12-31' });

  const { data: companies } = useQuery({ queryKey: ['fr-companies'], queryFn: async () => { const { data } = await supabase.from('restaurant_companies').select('*'); return data || []; } });
  const { data: branches } = useQuery({ queryKey: ['fr-branches'], queryFn: async () => { const { data } = await supabase.from('restaurant_branches').select('*'); return data || []; } });
  const { data: orders } = useQuery({ queryKey: ['fr-orders', dateRange], queryFn: async () => {
    const { data } = await supabase.from('orders').select('*').gte('created_at', dateRange.start).lte('created_at', dateRange.end + 'T23:59:59');
    return data || [];
  }});

  const companyStats = companies?.map(c => {
    const cBranches = branches?.filter(b => b.company_id === c.id) || [];
    const branchIds = cBranches.map(b => b.id);
    const cOrders = orders?.filter(o => branchIds.includes(o.branch_id)) || [];
    const paid = cOrders.filter(o => o.status === 'paid');
    const revenue = paid.reduce((s, o) => s + Number(o.total_amount), 0);
    return { name: c.name, revenue, orderCount: cOrders.length, avgOrder: paid.length ? Math.round(revenue / paid.length) : 0 };
  }) || [];

  const exportCSV = () => {
    const rows = [['Company', 'Revenue (ETB)', 'Orders', 'Avg Order (ETB)']];
    companyStats.forEach(s => rows.push([s.name, String(s.revenue), String(s.orderCount), String(s.avgOrder)]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'financial-report.csv'; a.click();
    toast.success('Exported');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold">Financial Reports</h1>
        <div className="flex items-center gap-3">
          <Label className="text-xs">From</Label>
          <Input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} className="w-36 h-8 text-xs" />
          <Label className="text-xs">To</Label>
          <Input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} className="w-36 h-8 text-xs" />
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3 w-3 mr-1" /> Export</Button>
        </div>
      </div>

      <Card style={cardStyle} className="border-0 mb-6">
        <CardHeader><CardTitle className="font-display text-sm">Revenue by Company</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={companyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' }} />
              <Bar dataKey="revenue" fill="hsl(25, 80%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card style={cardStyle} className="border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left" style={{ borderColor: 'hsl(222, 30%, 18%)', color: 'hsl(210, 15%, 55%)' }}>
                <th className="p-3">Company</th><th className="p-3">Revenue</th><th className="p-3">Orders</th><th className="p-3">Avg Order</th>
              </tr></thead>
              <tbody>
                {companyStats.map(s => (
                  <tr key={s.name} className="border-b last:border-0" style={{ borderColor: 'hsl(222, 30%, 18%)' }}>
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3">{s.revenue} ETB</td>
                    <td className="p-3">{s.orderCount}</td>
                    <td className="p-3">{s.avgOrder} ETB</td>
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

export default FinancialReports;

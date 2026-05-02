import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins } from 'lucide-react';

const StaffTipsOverview = () => {
  const { branchId } = useAuth();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const { data: rows } = useQuery({
    queryKey: ['branch-tips-overview', branchId],
    queryFn: async () => {
      // Fetch branch orders first to scope tips
      const { data: branchOrders } = await supabase
        .from('orders')
        .select('id, table_number')
        .eq('branch_id', branchId!);
      const orderMap = new Map((branchOrders || []).map(o => [o.id, o]));
      const orderIds = Array.from(orderMap.keys());
      if (orderIds.length === 0) return [];

      const { data } = await supabase
        .from('feedback')
        .select('tip_amount, staff_id, created_at, order_id')
        .in('order_id', orderIds)
        .gt('tip_amount', 0)
        .order('created_at', { ascending: false });
      return (data || []).map((r: any) => ({ ...r, orders: orderMap.get(r.order_id) }));
    },
    enabled: !!branchId,
  });

  const periodFiltered = useMemo(() => {
    if (!rows) return [];
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfWeek.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return rows.filter((r: any) => {
      const d = new Date(r.created_at);
      if (period === 'today') return d >= startOfDay;
      if (period === 'week') return d >= startOfWeek;
      if (period === 'month') return d >= startOfMonth;
      return true;
    });
  }, [rows, period]);

  const staffIds = useMemo(
    () => Array.from(new Set(periodFiltered.map((r: any) => r.staff_id).filter(Boolean))),
    [periodFiltered]
  );

  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-tips', staffIds.join(',')],
    queryFn: async () => {
      if (staffIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', staffIds);
      return data || [];
    },
    enabled: staffIds.length > 0,
  });

  const nameFor = (id: string | null) => {
    if (!id) return 'Unassigned';
    const p = profiles?.find((x: any) => x.user_id === id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  const total = periodFiltered.reduce((s: number, r: any) => s + Number(r.tip_amount || 0), 0);
  const byStaff = new Map<string, number>();
  periodFiltered.forEach((r: any) => {
    const k = r.staff_id || 'unassigned';
    byStaff.set(k, (byStaff.get(k) || 0) + Number(r.tip_amount || 0));
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-display font-bold">Tips Overview</h1>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card border-0 bg-hero-gradient text-primary-foreground mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="h-5 w-5" />
            <p className="text-sm opacity-90">Branch total ({period})</p>
          </div>
          <p className="text-4xl font-display font-bold">{total.toFixed(2)} <span className="text-base font-normal opacity-80">ETB</span></p>
          <p className="text-xs opacity-80 mt-1">{periodFiltered.length} tip{periodFiltered.length === 1 ? '' : 's'}</p>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0 mb-6">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <h2 className="font-display font-semibold">By staff member</h2>
          </div>
          {byStaff.size === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No tips for this period.</p>
          ) : (
            <ul className="divide-y">
              {Array.from(byStaff.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([id, amount]) => (
                  <li key={id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition">
                    <p className="text-sm font-medium">{nameFor(id === 'unassigned' ? null : id)}</p>
                    <p className="text-lg font-bold text-primary">
                      {amount.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">ETB</span>
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <h2 className="font-display font-semibold">All tips</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground bg-muted/40 border-b">
                  <th className="p-3">Waitress</th>
                  <th className="p-3">Tip Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Table</th>
                </tr>
              </thead>
              <tbody>
                {periodFiltered.map((r: any, i: number) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3 font-medium">{nameFor(r.staff_id)}</td>
                    <td className="p-3 font-bold text-primary">{Number(r.tip_amount).toFixed(2)} ETB</td>
                    <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{r.orders?.table_number ?? '—'}</td>
                  </tr>
                ))}
                {periodFiltered.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No tip records.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffTipsOverview;

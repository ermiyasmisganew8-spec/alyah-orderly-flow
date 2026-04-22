import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Coins } from 'lucide-react';

const StaffTipsOverview = () => {
  const { branchId } = useAuth();

  const { data: rows } = useQuery({
    queryKey: ['branch-tips-overview', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('feedback')
        .select('tip_amount, staff_id, created_at, orders!inner(branch_id, table_number)')
        .eq('orders.branch_id', branchId!)
        .gt('tip_amount', 0)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!branchId,
  });

  const today = new Date().toDateString();
  const byStaffToday = new Map<string, number>();
  let totalToday = 0;
  (rows || []).forEach((r: any) => {
    if (new Date(r.created_at).toDateString() !== today) return;
    const key = r.staff_id || 'unassigned';
    byStaffToday.set(key, (byStaffToday.get(key) || 0) + Number(r.tip_amount || 0));
    totalToday += Number(r.tip_amount || 0);
  });

  const staffIds = Array.from(byStaffToday.keys()).filter(k => k !== 'unassigned');
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-tips', staffIds.join(',')],
    queryFn: async () => {
      if (staffIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', staffIds);
      return data || [];
    },
    enabled: staffIds.length > 0,
  });

  const nameFor = (id: string) => {
    if (id === 'unassigned') return 'Unassigned orders';
    const p = profiles?.find((x: any) => x.user_id === id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-6">Tips Overview — Today</h1>

      <Card className="shadow-card border-0 bg-hero-gradient text-primary-foreground mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="h-5 w-5" />
            <p className="text-sm opacity-90">Branch total today</p>
          </div>
          <p className="text-4xl font-display font-bold">{totalToday.toFixed(2)} <span className="text-base font-normal opacity-80">ETB</span></p>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <h2 className="font-display font-semibold">By staff member</h2>
          </div>
          {byStaffToday.size === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No tips recorded today.</p>
          ) : (
            <ul className="divide-y">
              {Array.from(byStaffToday.entries()).map(([id, amount]) => (
                <li key={id} className="px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-medium">{nameFor(id)}</p>
                  <p className="text-lg font-bold text-primary">
                    {amount.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">ETB</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffTipsOverview;

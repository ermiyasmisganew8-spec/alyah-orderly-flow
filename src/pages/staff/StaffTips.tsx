import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Wallet, Info } from 'lucide-react';

const StaffTips = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['staff-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('full_name, email').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: tips, isLoading } = useQuery({
    queryKey: ['staff-tips', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('feedback')
        .select('id, tip_amount, comment, created_at, order_id, orders(table_number)')
        .eq('staff_id', user!.id)
        .gt('tip_amount', 0)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const today = new Date().toDateString();
  const todayTips = (tips || []).filter((t: any) => new Date(t.created_at).toDateString() === today);
  const todayTotal = todayTips.reduce((s: number, t: any) => s + Number(t.tip_amount || 0), 0);
  const allTimeTotal = (tips || []).reduce((s: number, t: any) => s + Number(t.tip_amount || 0), 0);

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'there';

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-1">Welcome, {displayName}</h1>
      <p className="text-sm text-muted-foreground mb-6">Here are your tips at a glance.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="shadow-card border-0 bg-hero-gradient text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-5 w-5" />
              <p className="text-sm opacity-90">Today's Tips</p>
            </div>
            <p className="text-4xl font-display font-bold">{todayTotal.toFixed(2)} <span className="text-base font-normal opacity-80">ETB</span></p>
            <p className="text-xs opacity-80 mt-1">{todayTips.length} {todayTips.length === 1 ? 'tip' : 'tips'} recorded</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Coins className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">All-time Total</p>
            </div>
            <p className="text-4xl font-display font-bold text-primary">{allTimeTotal.toFixed(2)} <span className="text-base font-normal text-muted-foreground">ETB</span></p>
            <p className="text-xs text-muted-foreground mt-1">{(tips || []).length} total tips</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-0 mb-4 bg-muted/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Recorded tips — withdraw cash at end of day. These are records of cash tips from customers; no money moves through the system.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <h2 className="font-display font-semibold">Recent Tips</h2>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : (tips || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No tips yet. Tips from customers will appear here.
            </p>
          ) : (
            <ul className="divide-y">
              {tips!.map((t: any) => (
                <li key={t.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Order #{t.order_id.slice(0, 8)}
                      {t.orders?.table_number ? <span className="text-muted-foreground"> • Table {t.orders.table_number}</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString()}
                    </p>
                    {t.comment && <p className="text-xs italic text-muted-foreground mt-1 truncate">"{t.comment}"</p>}
                  </div>
                  <p className="text-lg font-bold text-primary shrink-0 ml-3">
                    +{Number(t.tip_amount).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">ETB</span>
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

export default StaffTips;

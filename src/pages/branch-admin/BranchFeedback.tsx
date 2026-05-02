import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, UtensilsCrossed, Coins } from 'lucide-react';
import { toast } from 'sonner';

const BranchFeedback = () => {
  const { branchId } = useAuth();
  const queryClient = useQueryClient();
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'tip_desc' | 'name_asc'>('date_desc');

  const { data: feedbackList } = useQuery({
    queryKey: ['feedback', branchId],
    queryFn: async () => {
      // Get this branch's order IDs first (no FK embed available between feedback.order_id and orders)
      const { data: branchOrders } = await supabase
        .from('orders')
        .select('id, table_number')
        .eq('branch_id', branchId!);
      const orderIds = (branchOrders || []).map(o => o.id);
      if (orderIds.length === 0) return [];
      const orderMap = new Map(branchOrders!.map(o => [o.id, o]));

      const { data: rows } = await supabase
        .from('feedback')
        .select('*, menu_items(name)')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });
      return (rows || []).map((r: any) => ({ ...r, orders: orderMap.get(r.order_id) }));
    },
    enabled: !!branchId,
  });

  // Resolve customer + staff names by joining profiles client-side (no FK relationship in schema)
  const personIds = useMemo(() => {
    const ids = new Set<string>();
    (feedbackList || []).forEach((f: any) => {
      if (f.customer_id) ids.add(f.customer_id);
      if (f.staff_id) ids.add(f.staff_id);
    });
    return Array.from(ids);
  }, [feedbackList]);

  const { data: peopleProfiles } = useQuery({
    queryKey: ['feedback-people', personIds.join(',')],
    queryFn: async () => {
      if (personIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', personIds);
      return data || [];
    },
    enabled: personIds.length > 0,
  });

  const profileFor = (id: string | null) =>
    id ? peopleProfiles?.find((p: any) => p.user_id === id) : undefined;

  // Staff list for filter dropdown
  const staffIds = useMemo(
    () => Array.from(new Set((feedbackList || []).map((f: any) => f.staff_id).filter(Boolean))),
    [feedbackList]
  );

  const staffName = (id: string | null) => {
    if (!id) return '—';
    const p = profileFor(id);
    return p?.full_name || p?.email || id.slice(0, 8);
  };

  const markReviewed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feedback').update({ is_reviewed: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast.success('Marked as reviewed');
    },
  });

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfWeek.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let list = (feedbackList || []).filter((f: any) => {
      if (staffFilter === 'unassigned' && f.staff_id) return false;
      if (staffFilter !== 'all' && staffFilter !== 'unassigned' && f.staff_id !== staffFilter) return false;

      const d = new Date(f.created_at);
      if (periodFilter === 'today' && d < startOfDay) return false;
      if (periodFilter === 'week' && d < startOfWeek) return false;
      if (periodFilter === 'month' && d < startOfMonth) return false;

      if (ratingFilter === '5' && f.rating !== 5) return false;
      if (ratingFilter === '4' && f.rating !== 4) return false;
      if (ratingFilter === 'low' && f.rating > 3) return false;
      return true;
    });

    list = [...list].sort((a: any, b: any) => {
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'tip_desc') return Number(b.tip_amount || 0) - Number(a.tip_amount || 0);
      if (sortBy === 'name_asc') {
        const an = profileFor(a.customer_id)?.full_name || '';
        const bn = profileFor(b.customer_id)?.full_name || '';
        return an.localeCompare(bn);
      }
      return 0;
    });
    return list;
  }, [feedbackList, staffFilter, periodFilter, ratingFilter, sortBy, peopleProfiles]);

  const avgRating = filtered.length
    ? (filtered.reduce((s, f: any) => s + f.rating, 0) / filtered.length).toFixed(1)
    : '0';
  const totalTips = filtered.reduce((s, f: any) => s + Number(f.tip_amount || 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-display font-bold">Feedback</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All staff</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {staffIds.map((id: any) => (
                <SelectItem key={id} value={id}>{staffName(id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={(v: any) => setPeriodFilter(v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ratingFilter} onValueChange={(v: any) => setRatingFilter(v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
              <SelectItem value="4">4 stars</SelectItem>
              <SelectItem value="low">3 & below</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Date (newest)</SelectItem>
              <SelectItem value="date_asc">Date (oldest)</SelectItem>
              <SelectItem value="tip_desc">Tip amount</SelectItem>
              <SelectItem value="name_asc">Customer name</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-gold fill-current" />
            <span className="text-xl font-bold">{avgRating}</span>
            <span className="text-sm text-muted-foreground">({filtered.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold">{totalTips.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">ETB tips</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((f: any) => {
          const itemName = f.menu_items?.name || (f.menu_item_id ? 'Deleted item' : 'Unknown');
          const customerProfile = profileFor(f.customer_id);
          const customerName = customerProfile?.full_name || customerProfile?.email || 'Anonymous';
          const tip = Number(f.tip_amount || 0);
          return (
            <Card key={f.id} className="shadow-card border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm flex items-center gap-1.5 truncate">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-primary shrink-0" />
                      {itemName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      by {customerName}
                      {f.orders?.table_number ? ` • Table ${f.orders.table_number}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Waiter: {staffName(f.staff_id)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < f.rating ? 'text-gold fill-current' : 'text-muted'}`} />
                  ))}
                </div>
                {f.comment && <p className="text-sm text-muted-foreground mb-3 italic">"{f.comment}"</p>}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {tip > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Coins className="h-3 w-3" />
                        {tip.toFixed(2)} ETB tip
                      </Badge>
                    )}
                  </div>
                  {f.is_reviewed ? (
                    <Badge variant="secondary">Reviewed</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => markReviewed.mutate(f.id)}>
                      Mark Reviewed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="md:col-span-2 shadow-card border-0">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Star className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No feedback yet. Customer reviews will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BranchFeedback;

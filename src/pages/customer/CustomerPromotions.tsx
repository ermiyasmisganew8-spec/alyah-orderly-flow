import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface OutletCtx {
  branchId: string;
}

const CustomerPromotions = () => {
  const { branchId } = useOutletContext<OutletCtx>();

  const { data: promotions } = useQuery({
    queryKey: ['promotions', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_active', true);
      return data || [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold mb-2">Promotions</h1>
      <p className="text-muted-foreground mb-8">Don't miss our special offers</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions?.map(p => (
          <Card key={p.id} className="shadow-card border-0 overflow-hidden">
            <div className="h-2 bg-hero-gradient" />
            <CardContent className="p-6">
              <Badge className="mb-3">
                {p.discount_type === 'percentage' ? `${p.discount_value}% OFF` :
                 p.discount_type === 'bogo' ? 'BOGO' : `${p.discount_value} ETB OFF`}
              </Badge>
              <h3 className="font-display text-xl font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(p.start_date).toLocaleDateString()} – {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'Ongoing'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomerPromotions;

import { Outlet, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CustomerNav from '@/components/customer/CustomerNav';
import { CartProvider } from '@/contexts/CartContext';

const CustomerLayout = () => {
  const { companyId, branchId } = useParams<{ companyId: string; branchId: string }>();
  const [searchParams] = useSearchParams();
  const tableNumber = parseInt(searchParams.get('table') || '1', 10);

  const { data: company } = useQuery({
    queryKey: ['company-info', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('restaurant_companies')
        .select('name')
        .eq('id', companyId!)
        .single();
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const companyName = company?.name || 'Restaurant';

  if (!companyId || !branchId) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Invalid URL</div>;
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <CustomerNav companyId={companyId} branchId={branchId} tableNumber={tableNumber} companyName={companyName} />
        <Outlet context={{ companyId, branchId, tableNumber, companyName }} />
        <footer className="border-t bg-card py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p className="font-display text-lg font-semibold text-foreground mb-2">{companyName} Cafe and Restaurant</p>
            <p>123 in front of poly campus, Bahir Dar</p>
            <p className="mt-1">Open Daily: 7:00 AM – 10:00 PM</p>
            <p className="mt-4 text-xs">Powered by Alyah Menu</p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
};

export default CustomerLayout;

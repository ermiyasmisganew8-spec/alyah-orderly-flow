import { Outlet, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CustomerNav from '@/components/customer/CustomerNav';
import CustomerFooter from '@/components/customer/CustomerFooter';
import ActiveOrderBanner from '@/components/customer/ActiveOrderBanner';
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
        .select('name, contact_email, phone, location, opening_hours, about_story, values_text, logo_url, footer_data')
        .eq('id', companyId!)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
    staleTime: 30 * 1000,
  });

  const companyName = company?.name || 'Restaurant';
  const footerData = (company?.footer_data || {}) as any;

  if (!companyId || !branchId) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Invalid URL</div>;
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <CustomerNav
          companyId={companyId}
          branchId={branchId}
          tableNumber={tableNumber}
          companyName={companyName}
          logoUrl={company?.logo_url || null}
        />
        <ActiveOrderBanner companyId={companyId} branchId={branchId} tableNumber={tableNumber} />
        <div className="flex-1">
          <Outlet context={{ companyId, branchId, tableNumber, companyName, company }} />
        </div>
        <CustomerFooter
          companyId={companyId}
          branchId={branchId}
          tableNumber={tableNumber}
          companyName={companyName}
          phone={footerData.phone || company?.phone}
          location={footerData.address || company?.location}
          email={footerData.email || company?.contact_email}
          openingHours={company?.opening_hours as any}
          openingHoursText={footerData.opening_hours}
          aboutText={footerData.about_text}
          socialFacebook={footerData.social_facebook}
          socialInstagram={footerData.social_instagram}
          socialLinkedin={footerData.social_linkedin}
        />
      </div>
    </CartProvider>
  );
};

export default CustomerLayout;

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCompanyName = (companyId: string | null | undefined) => {
  const { data: companyName } = useQuery({
    queryKey: ['company-name', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('restaurant_companies')
        .select('name')
        .eq('id', companyId!)
        .single();
      return data?.name || 'Restaurant';
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
  return companyName || 'Restaurant';
};

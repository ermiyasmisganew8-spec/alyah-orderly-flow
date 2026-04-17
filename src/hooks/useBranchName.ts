import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBranchName = (branchId: string | null | undefined) => {
  const { data: branchName } = useQuery({
    queryKey: ['branch-name', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('restaurant_branches')
        .select('name')
        .eq('id', branchId!)
        .maybeSingle();
      return data?.name || 'Branch';
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000,
  });
  return branchName || 'Branch';
};

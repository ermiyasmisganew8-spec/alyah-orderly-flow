import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'alyah_active_orders';

type ActiveOrdersMap = Record<string, string>; // { [branchId]: orderId }

export const getStoredActiveOrders = (): ActiveOrdersMap => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const setStoredActiveOrder = (branchId: string, orderId: string) => {
  const map = getStoredActiveOrders();
  map[branchId] = orderId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

export const clearStoredActiveOrder = (branchId: string) => {
  const map = getStoredActiveOrders();
  delete map[branchId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

const ACTIVE_STATUSES = ['pending', 'preparing'];

/**
 * Returns the active order id for the current customer at this branch, if any.
 * - Logged-in: queries orders by customer_id
 * - Guest: looks up the stored order id and verifies it's still active
 */
export const useActiveOrder = (branchId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-order', branchId, user?.id ?? 'guest'],
    queryFn: async () => {
      if (!branchId) return null;

      if (user) {
        const { data } = await supabase
          .from('orders')
          .select('id, status')
          .eq('branch_id', branchId)
          .eq('customer_id', user.id)
          .in('status', ACTIVE_STATUSES)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return data?.id ?? null;
      }

      const stored = getStoredActiveOrders()[branchId];
      if (!stored) return null;

      const { data } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', stored)
        .maybeSingle();

      if (!data || !ACTIVE_STATUSES.includes(data.status)) {
        clearStoredActiveOrder(branchId);
        return null;
      }
      return data.id;
    },
    enabled: !!branchId,
    refetchInterval: 15000,
    staleTime: 5000,
  });
};

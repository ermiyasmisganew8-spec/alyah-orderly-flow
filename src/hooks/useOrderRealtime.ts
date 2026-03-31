import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to real-time order updates for a branch.
 * Invalidates the given query keys whenever orders change.
 */
export function useOrderRealtime(branchId: string | null, queryKeys: string[][]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!branchId) return;

    const channel = supabase
      .channel(`orders-branch-${branchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, queryClient]);
}

/**
 * Subscribe to real-time updates for a specific order.
 */
export function useOrderTrackingRealtime(orderId: string | undefined, queryKeys: string[][]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);
}

import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

const BranchFeedback = () => {
  const { branchId } = useAuth();
  const queryClient = useQueryClient();

  const { data: feedbackList } = useQuery({
    queryKey: ['feedback', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('feedback')
        .select('*, orders!inner(branch_id)')
        .eq('orders.branch_id', branchId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!branchId,
  });

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

  const avgRating = feedbackList?.length
    ? (feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length).toFixed(1)
    : '0';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Feedback</h1>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-gold fill-current" />
          <span className="text-xl font-bold">{avgRating}</span>
          <span className="text-sm text-muted-foreground">({feedbackList?.length || 0} reviews)</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {feedbackList?.map(f => (
          <Card key={f.id} className="shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < f.rating ? 'text-gold fill-current' : 'text-muted'}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-2">{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
              {f.comment && <p className="text-sm text-muted-foreground mb-3">{f.comment}</p>}
              <div className="flex items-center justify-between">
                {f.is_reviewed ? (
                  <Badge variant="secondary">Reviewed</Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => markReviewed.mutate(f.id)}>Mark Reviewed</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BranchFeedback;

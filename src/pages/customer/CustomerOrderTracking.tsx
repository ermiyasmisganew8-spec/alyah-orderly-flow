import { useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrderTrackingRealtime } from '@/hooks/useOrderRealtime';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { CheckCircle, Clock, ChefHat, UtensilsCrossed, Star, MessageSquare, LogIn, CreditCard, Smartphone, Coins } from 'lucide-react';
import { clearStoredActiveOrder } from '@/hooks/useActiveOrder';

interface OutletCtx {
  branchId: string;
  tableNumber: number;
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  preparing: ChefHat,
  served: UtensilsCrossed,
  paid: CheckCircle,
};

const CustomerOrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { branchId } = useOutletContext<OutletCtx>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [feedbackItem, setFeedbackItem] = useState<{ id: string; name: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tipAmount, setTipAmount] = useState('');

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTipPreset, setPayTipPreset] = useState<'0' | '5' | '10' | '15' | 'custom'>('10');
  const [payTipCustom, setPayTipCustom] = useState('');
  const [payMethod, setPayMethod] = useState<'cbe' | 'telebirr' | 'cash'>('cbe');
  const [paying, setPaying] = useState(false);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', fullName: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingFeedbackItem, setPendingFeedbackItem] = useState<{ id: string; name: string } | null>(null);

  const { data: order, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name))')
        .eq('id', orderId!)
        .single();
      return data;
    },
  });

  const { data: existingFeedback } = useQuery({
    queryKey: ['order-feedback', orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from('feedback')
        .select('*')
        .eq('order_id', orderId!);
      return data || [];
    },
    enabled: !!orderId,
  });

  useOrderTrackingRealtime(orderId, [['order', orderId!]]);

  const submitFeedback = useMutation({
    mutationFn: async () => {
      if (!feedbackItem) return;
      const tipNum = parseFloat(tipAmount);
      const tip = isNaN(tipNum) || tipNum < 0 ? 0 : tipNum;
      const { error } = await supabase.from('feedback').insert({
        order_id: orderId!,
        menu_item_id: feedbackItem.id || null,
        rating,
        comment: comment || null,
        customer_id: user!.id,
        tip_amount: tip,
        staff_id: (order as any)?.staff_id ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-feedback', orderId] });
      toast.success('Thank you for your feedback!');
      setFeedbackItem(null);
      setRating(5);
      setComment('');
      setTipAmount('');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to submit feedback'),
  });

  const handleFeedbackClick = (item: { id: string; name: string }) => {
    if (!user) {
      setPendingFeedbackItem(item);
      setShowAuthModal(true);
      return;
    }
    setFeedbackItem(item);
    setRating(5);
    setComment('');
    setTipAmount('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: { data: { full_name: authForm.fullName } },
        });
        if (error) throw error;
        toast.success('Account created! You can now submit feedback.');
      }
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '', fullName: '' });
      // Open the feedback modal for the pending item
      if (pendingFeedbackItem) {
        setTimeout(() => {
          setFeedbackItem(pendingFeedbackItem);
          setPendingFeedbackItem(null);
          setRating(5);
          setComment('');
          setTipAmount('');
        }, 500);
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const computeTip = (subtotal: number) => {
    if (payTipPreset === 'custom') {
      const v = parseFloat(payTipCustom);
      return isNaN(v) || v < 0 ? 0 : v;
    }
    const pct = parseInt(payTipPreset, 10);
    return Math.round((subtotal * pct) / 100 * 100) / 100;
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const subtotal = Number(order.total_amount);
      const tip = computeTip(subtotal);
      const total = subtotal + tip;
      const methodLabel = payMethod === 'cbe' ? 'CBE Birr' : payMethod === 'telebirr' ? 'Telebirr' : 'Cash';

      const { error: payError } = await supabase.from('payments').insert({
        order_id: order.id,
        amount: total,
        method: methodLabel,
        status: 'completed',
        transaction_ref: `PAY-${Date.now()}`,
        tip_amount: tip,
        staff_id: (order as any).staff_id ?? null,
      } as any);
      if (payError) throw payError;

      // Record the tip as a feedback row tied to the assigned waiter so it shows in /staff/tips
      if (tip > 0 && (order as any).staff_id) {
        await supabase.from('feedback').insert({
          order_id: order.id,
          rating: 5,
          tip_amount: tip,
          staff_id: (order as any).staff_id,
          customer_id: user?.id ?? null,
          comment: `Tip via ${methodLabel}`,
        } as any);
      }

      await supabase.from('orders').update({ status: 'paid' as const }).eq('id', order.id);
      clearStoredActiveOrder(order.branch_id);
      queryClient.invalidateQueries({ queryKey: ['active-order', order.branch_id] });
      toast.success(`Paid ${total.toFixed(2)} ETB via ${methodLabel}${tip > 0 ? ` (incl. ${tip.toFixed(2)} ETB tip)` : ''}`);
      setShowPayModal(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (!order) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading order...</div>;
  }

  const steps = ['pending', 'preparing', 'served', 'paid'];
  const currentStep = steps.indexOf(order.status);
  const StatusIcon = statusIcons[order.status] || Clock;
  const reviewedItemIds = new Set((existingFeedback || []).map((f: any) => f.menu_item_id).filter(Boolean));

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-display font-bold mb-2">Order Tracking</h1>
      <p className="text-muted-foreground mb-8">Order #{order.id.slice(0, 8)}</p>

      {/* Status Progress */}
      <Card className="shadow-card border-0 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-hero-gradient flex items-center justify-center">
              <StatusIcon className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-center font-display text-xl font-semibold mb-4">
            {ORDER_STATUS_LABELS[order.status]}
          </h2>
          <div className="flex justify-between items-center mb-2">
            {steps.map((step, i) => (
              <div key={step} className="flex-1 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${
                    i < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map(s => <span key={s}>{ORDER_STATUS_LABELS[s]}</span>)}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card className="shadow-card border-0 mb-6">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Items</h3>
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <div className="flex-1">
                <span>{item.quantity}x {item.menu_items?.name || 'Item'}</span>
              </div>
              <span className="font-medium mr-3">{item.subtotal} ETB</span>
              {order.status === 'paid' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={reviewedItemIds.has(item.menu_item_id)}
                  onClick={() => handleFeedbackClick({ id: item.menu_item_id, name: item.menu_items?.name || 'Item' })}
                >
                  {reviewedItemIds.has(item.menu_item_id) ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Reviewed</>
                  ) : (
                    <><MessageSquare className="h-3 w-3 mr-1" /> Feedback</>
                  )}
                </Button>
              )}
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">{order.total_amount} ETB</span>
          </div>
        </CardContent>
      </Card>

      {/* Pay Button */}
      {order.status === 'served' && (
        <Button className="w-full" size="lg" onClick={handlePayment}>
          Pay Now — {order.total_amount} ETB
        </Button>
      )}

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              {authMode === 'login' ? 'Log In to Leave Feedback' : 'Sign Up to Leave Feedback'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <Label>Full Name</Label>
                <Input value={authForm.fullName} onChange={e => setAuthForm(f => ({ ...f, fullName: e.target.value }))} required />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input type="email" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Log In' : 'Sign Up'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {authMode === 'login' ? (
                <>Don't have an account? <button type="button" className="text-primary underline" onClick={() => setAuthMode('signup')}>Sign Up</button></>
              ) : (
                <>Already have an account? <button type="button" className="text-primary underline" onClick={() => setAuthMode('login')}>Log In</button></>
              )}
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={!!feedbackItem} onOpenChange={() => setFeedbackItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Rate {feedbackItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                  <Star className={`h-8 w-8 ${star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
            </p>
            <Textarea
              placeholder="Share your experience (optional)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
            <div>
              <Label htmlFor="tip" className="text-sm">Optional Tip (ETB)</Label>
              <Input
                id="tip"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={tipAmount}
                onChange={e => setTipAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Extra tip for the waitress (record only — pay in cash)
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => submitFeedback.mutate()}
              disabled={submitFeedback.isPending}
            >
              {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerOrderTracking;

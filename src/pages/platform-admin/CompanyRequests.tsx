import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, X, Copy, Clock, DollarSign } from 'lucide-react';

const cardStyle = { background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' };

const CompanyRequests = () => {
  const queryClient = useQueryClient();
  const [credModal, setCredModal] = useState<{ email: string; password: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: requests } = useQuery({
    queryKey: ['company-requests'],
    queryFn: async () => {
      const { data } = await supabase.from('company_requests' as any).select('*').order('created_at', { ascending: false });
      return (data || []) as any[];
    },
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const approveMutation = useMutation({
    mutationFn: async (req: any) => {
      const tempPassword = generatePassword();

      // Create company
      const { data: company, error: compErr } = await supabase.from('restaurant_companies').insert({
        name: req.restaurant_name, contact_email: req.email,
      }).select().single();
      if (compErr) throw compErr;

      // Create default branch
      const { error: brErr } = await supabase.from('restaurant_branches').insert({
        company_id: company.id, name: 'Main Branch',
      });
      if (brErr) throw brErr;

      // Create admin user via edge function
      const { data, error: fnErr } = await supabase.functions.invoke('create-admin-user', {
        body: { email: req.email, password: tempPassword, full_name: req.owner_name, role: 'company_admin', company_id: company.id },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      // Send credential email
      try {
        await supabase.functions.invoke('send-credential-email', {
          body: { to: req.email, name: req.owner_name, email: req.email, password: tempPassword, role: 'Company Admin' },
        });
      } catch { /* email logging only in demo */ }

      // Update request status
      await supabase.from('company_requests' as any).update({ status: 'approved' } as any).eq('id', req.id);

      return { email: req.email, password: tempPassword, name: req.restaurant_name };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['company-requests'] });
      queryClient.invalidateQueries({ queryKey: ['platform-companies'] });
      setCredModal(result);
      toast.success('Company approved and credentials created!');
    },
    onError: (err: any) => toast.error(err.message || 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('company_requests' as any).update({ status: 'rejected' } as any).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-requests'] });
      toast.success('Request rejected.');
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('company_requests' as any).update({ payment_status: 'paid' } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-requests'] });
      toast.success('Marked as paid.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const handleCopy = () => {
    if (!credModal) return;
    navigator.clipboard.writeText(`Email: ${credModal.email}\nPassword: ${credModal.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { pending: 'secondary', approved: 'default', rejected: 'destructive' };
    return <Badge variant={colors[status] as any || 'secondary'} className="capitalize">{status}</Badge>;
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Company Requests</h1>

      {/* Credentials Modal */}
      <Dialog open={!!credModal} onOpenChange={() => { setCredModal(null); setCopied(false); }}>
        <DialogContent className="dark" style={{ background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)', color: 'hsl(210, 30%, 92%)' }}>
          <DialogHeader><DialogTitle className="font-display">Company Admin Credentials</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'hsl(210, 15%, 75%)' }}>
              <strong>{credModal?.name}</strong> has been approved. Credentials have been emailed.
            </p>
            <div className="rounded-lg p-4" style={{ background: 'hsl(222, 35%, 14%)', border: '1px solid hsl(222, 30%, 22%)' }}>
              <div className="space-y-2 text-sm font-mono">
                <p><span style={{ color: 'hsl(210, 15%, 55%)' }}>Email:</span> {credModal?.email}</p>
                <p><span style={{ color: 'hsl(210, 15%, 55%)' }}>Password:</span> {credModal?.password}</p>
              </div>
            </div>
            <Button className="w-full" onClick={handleCopy}>
              {copied ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy Credentials</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card style={cardStyle} className="border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'hsl(222, 30%, 18%)', color: 'hsl(210, 15%, 55%)' }}>
                  <th className="p-3">Restaurant</th><th className="p-3">Owner</th><th className="p-3">Email</th>
                  <th className="p-3">Phone</th><th className="p-3">Plan</th><th className="p-3">Cycle</th>
                  <th className="p-3">Pay Method</th>
                  <th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests?.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0" style={{ borderColor: 'hsl(222, 30%, 18%)' }}>
                    <td className="p-3 font-medium">{r.restaurant_name}</td>
                    <td className="p-3">{r.owner_name}</td>
                    <td className="p-3" style={{ color: 'hsl(210, 15%, 55%)' }}>{r.email}</td>
                    <td className="p-3" style={{ color: 'hsl(210, 15%, 55%)' }}>{r.phone}</td>
                    <td className="p-3 capitalize">{r.preferred_plan}</td>
                    <td className="p-3 capitalize">{r.billing_cycle || 'monthly'}</td>
                    <td className="p-3">
                      {r.payment_method ? (
                        <Badge variant="outline" className="uppercase">{r.payment_method === 'cbe' ? 'CBE' : 'Telebirr'}</Badge>
                      ) : (
                        <span style={{ color: 'hsl(210, 15%, 45%)' }}>—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={r.payment_status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                        {r.payment_status || 'pending'}
                      </Badge>
                    </td>
                    <td className="p-3">{statusBadge(r.status)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {r.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost" className="text-green-400" onClick={() => approveMutation.mutate(r)} disabled={approveMutation.isPending}>
                              <Check className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400" onClick={() => rejectMutation.mutate(r.id)}>
                              <X className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {r.payment_status !== 'paid' && (
                          <Button size="sm" variant="ghost" className="text-blue-400" onClick={() => markPaidMutation.mutate(r.id)}>
                            <DollarSign className="h-3 w-3 mr-1" /> Mark Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!requests || requests.length === 0) && (
                  <tr><td colSpan={10} className="p-6 text-center" style={{ color: 'hsl(210, 15%, 45%)' }}>
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" /> No requests yet
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyRequests;

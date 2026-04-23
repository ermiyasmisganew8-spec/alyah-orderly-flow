import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const ROLE_REDIRECTS: Record<string, string> = {
  staff: '/staff',
  branch_admin: '/branch-admin',
  company_admin: '/company-admin',
  platform_admin: '/platform-admin',
};

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;

      // Fetch role from database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication failed');

      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('role, staff_position')
        .eq('user_id', user.id);

      if (!roleRows || roleRows.length === 0) {
        await supabase.auth.signOut();
        toast.error('Account not properly configured. Contact support.');
        return;
      }

      // Pick highest-privilege role if a user has multiple
      const priority = ['platform_admin', 'company_admin', 'branch_admin', 'staff', 'customer'];
      const roleData = [...roleRows].sort(
        (a, b) => priority.indexOf(a.role) - priority.indexOf(b.role)
      )[0];

      let redirect = ROLE_REDIRECTS[roleData.role];
      // Only managers see the orders dashboard; waiters and chiefs go to the tips page
      if (roleData.role === 'staff') {
        const pos = (roleData as any).staff_position;
        redirect = pos === 'manager' ? '/staff' : '/staff/tips';
      }
      if (!redirect) {
        await supabase.auth.signOut();
        toast.error('Account not properly configured. Contact support.');
        return;
      }

      toast.success('Logged in!');
      navigate(redirect);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card border-0">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Alyah Menu Login</CardTitle>
          <CardDescription>Sign in to your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

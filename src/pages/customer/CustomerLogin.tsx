import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface OutletCtx {
  companyId: string;
  branchId: string;
  tableNumber: number;
}

const CustomerLogin = () => {
  const { companyId, branchId, tableNumber } = useOutletContext<OutletCtx>();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  useEffect(() => { setIsSignUp(searchParams.get('mode') === 'signup'); }, [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success('Account created! Check your email to verify.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Logged in!');
        navigate(`/b/${companyId}/${branchId}?table=${tableNumber}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md shadow-card border-0">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>{isSignUp ? 'Sign up to leave reviews and track orders' : 'Login to your account'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button className="text-primary font-medium" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLogin;

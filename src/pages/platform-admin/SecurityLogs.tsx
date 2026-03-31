import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';
import { toast } from 'sonner';

const cardStyle = { background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' };

const SecurityLogs = () => {
  const [search, setSearch] = useState('');

  const { data: logs } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
  });

  const filtered = logs?.filter(l =>
    search === '' ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.role?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const exportCSV = () => {
    const rows = [['Timestamp', 'Email', 'Role', 'Action', 'IP']];
    filtered.forEach(l => rows.push([l.created_at, l.user_email || '', l.role || '', l.action, l.ip_address || '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'security-logs.csv'; a.click();
    toast.success('Exported');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold">Security Logs</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(210, 15%, 55%)' }} />
            <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3 w-3 mr-1" /> Export</Button>
        </div>
      </div>

      <Card style={cardStyle} className="border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left" style={{ borderColor: 'hsl(222, 30%, 18%)', color: 'hsl(210, 15%, 55%)' }}>
                <th className="p-3">Timestamp</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Action</th><th className="p-3">IP</th>
              </tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b last:border-0" style={{ borderColor: 'hsl(222, 30%, 18%)' }}>
                    <td className="p-3 text-xs font-mono">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-3">{l.user_email || '—'}</td>
                    <td className="p-3 capitalize">{l.role || '—'}</td>
                    <td className="p-3">{l.action}</td>
                    <td className="p-3 font-mono text-xs">{l.ip_address || '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center" style={{ color: 'hsl(210, 15%, 55%)' }}>No logs found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityLogs;

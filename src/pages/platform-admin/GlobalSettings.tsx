import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const cardStyle = { background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 18%)' };

const GlobalSettings = () => {
  const [payment, setPayment] = useState({ cbe_key: '', telebirr_key: '' });
  const [locale, setLocale] = useState({ language: 'en', timezone: 'Africa/Addis_Ababa', currency: 'ETB', dateFormat: 'DD/MM/YYYY' });
  const [backup, setBackup] = useState({ schedule: 'daily' });

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Global Settings</h1>
      <Tabs defaultValue="payment">
        <TabsList style={{ background: 'hsl(222, 30%, 14%)' }}>
          <TabsTrigger value="payment">Payment Gateways</TabsTrigger>
          <TabsTrigger value="locale">Localization</TabsTrigger>
          <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="mt-6">
          <Card style={cardStyle} className="border-0">
            <CardHeader><CardTitle className="font-display text-lg">Payment Gateways</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>CBE API Key</Label><Input value={payment.cbe_key} onChange={e => setPayment(p => ({ ...p, cbe_key: e.target.value }))} placeholder="Enter CBE API key" /></div>
              <div><Label>Telebirr API Key</Label><Input value={payment.telebirr_key} onChange={e => setPayment(p => ({ ...p, telebirr_key: e.target.value }))} placeholder="Enter Telebirr API key" /></div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast.success('Connection test passed (simulated)')}>Test Connection</Button>
                <Button onClick={() => toast.success('Payment settings saved (simulated)')}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locale" className="mt-6">
          <Card style={cardStyle} className="border-0">
            <CardHeader><CardTitle className="font-display text-lg">Localization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Language</Label>
                <Select value={locale.language} onValueChange={v => setLocale(l => ({ ...l, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="am">Amharic</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Timezone</Label><Input value={locale.timezone} onChange={e => setLocale(l => ({ ...l, timezone: e.target.value }))} /></div>
              <div><Label>Currency</Label><Input value={locale.currency} onChange={e => setLocale(l => ({ ...l, currency: e.target.value }))} /></div>
              <div><Label>Date Format</Label>
                <Select value={locale.dateFormat} onValueChange={v => setLocale(l => ({ ...l, dateFormat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem><SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem><SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem></SelectContent>
                </Select>
              </div>
              <Button onClick={() => toast.success('Localization saved (simulated)')}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <Card style={cardStyle} className="border-0">
            <CardHeader><CardTitle className="font-display text-lg">Backup & Recovery</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Backup Schedule</Label>
                <Select value={backup.schedule} onValueChange={v => setBackup(b => ({ ...b, schedule: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="hourly">Hourly</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast.success('Manual backup started (simulated)')}>Manual Backup</Button>
                <Button variant="outline" onClick={() => toast.success('Restore initiated (simulated)')}>Restore</Button>
                <Button onClick={() => toast.success('Backup settings saved (simulated)')}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalSettings;

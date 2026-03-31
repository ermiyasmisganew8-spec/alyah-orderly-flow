import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const roles = ['Staff', 'Branch Admin', 'Company Admin'];
const resources = ['Orders', 'Menu', 'Profile', 'Feedback', 'Analytics'];
const operations = ['Create', 'Read', 'Update', 'Delete'];

const defaultPerms: Record<string, Record<string, string[]>> = {
  Staff: { Orders: ['Read', 'Update'], Menu: ['Read'], Profile: ['Read', 'Update'], Feedback: ['Read'], Analytics: [] },
  'Branch Admin': { Orders: ['Read', 'Update'], Menu: ['Create', 'Read', 'Update', 'Delete'], Profile: ['Read', 'Update'], Feedback: ['Read', 'Update'], Analytics: ['Read'] },
  'Company Admin': { Orders: ['Read'], Menu: ['Read'], Profile: ['Read', 'Update'], Feedback: ['Read'], Analytics: ['Read'] },
};

const CompanyPermissions = () => {
  const [perms, setPerms] = useState(defaultPerms);

  const toggle = (role: string, resource: string, op: string) => {
    setPerms(prev => {
      const current = prev[role][resource] || [];
      const next = current.includes(op) ? current.filter(o => o !== op) : [...current, op];
      return { ...prev, [role]: { ...prev[role], [resource]: next } };
    });
  };

  const handleSave = () => {
    toast.success('Permissions saved (simulated)');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Permissions</h1>
        <Button onClick={handleSave}>Save Permissions</Button>
      </div>

      <div className="space-y-6">
        {roles.map(role => (
          <Card key={role} className="shadow-card border-0">
            <CardHeader><CardTitle className="font-display text-lg">{role}</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2">Resource</th>
                      {operations.map(op => <th key={op} className="p-2 text-center">{op}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(res => (
                      <tr key={res} className="border-b last:border-0">
                        <td className="p-2 font-medium">{res}</td>
                        {operations.map(op => (
                          <td key={op} className="p-2 text-center">
                            <Checkbox
                              checked={(perms[role]?.[res] || []).includes(op)}
                              onCheckedChange={() => toggle(role, res, op)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CompanyPermissions;

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Download, QrCode, Trash2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface OutletCtx {
  branchId: string;
  companyId: string;
}

interface BranchTable {
  id: string;
  table_number: number;
  assigned_staff_id: string | null;
  status: string;
  qr_code_url: string | null;
}

interface Staff {
  id: string;
  full_name: string;
}

const TableManagement = () => {
  const { branchId } = useOutletContext<OutletCtx>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<BranchTable | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const queryClient = useQueryClient();
  const qrCodeRef = useState<HTMLDivElement>(null)[0];

  const { data: tables = [] } = useQuery({
    queryKey: ['branch_tables', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_tables')
        .select('*')
        .eq('branch_id', branchId)
        .order('table_number', { ascending: true });
      if (error) throw error;
      return data as BranchTable[];
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, user_id, profiles(full_name)')
        .eq('branch_id', branchId)
        .eq('staff_position', 'waiter')
        .limit(100);
      if (error) throw error;
      return data.map((s: any) => ({
        id: s.user_id,
        full_name: s.profiles?.full_name || 'Unknown',
      })) as Staff[];
    },
  });

  const addTableMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('branch_tables').insert({
        branch_id: branchId,
        table_number: parseInt(tableNumber),
        assigned_staff_id: assignedStaffId || null,
        status: 'active',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_tables', branchId] });
      toast.success('Table added successfully');
      setShowAddModal(false);
      setTableNumber('');
      setAssignedStaffId('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add table');
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const { error } = await supabase.from('branch_tables').delete().eq('id', tableId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_tables', branchId] });
      toast.success('Table deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete table');
    },
  });

  const downloadQRCode = (table: BranchTable) => {
    const qrElement = document.getElementById(`qr-${table.id}`);
    if (qrElement) {
      const canvas = qrElement.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `table-${table.table_number}-qr.png`;
        link.click();
        toast.success('QR code downloaded');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Table Management</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Table
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table #</TableHead>
                <TableHead>Assigned Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map(table => (
                <TableRow key={table.id}>
                  <TableCell className="font-semibold">{table.table_number}</TableCell>
                  <TableCell>{staff.find(s => s.id === table.assigned_staff_id)?.full_name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      table.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {table.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTable(table);
                        setShowQRModal(true);
                      }}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadQRCode(table)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTableMutation.mutate(table.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {tables.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No tables yet. Add one to get started.</p>
          )}
        </CardContent>
      </Card>

      {/* Add Table Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Table Number</Label>
              <Input
                type="number"
                min="1"
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                placeholder="e.g., 1, 2, 3..."
              />
            </div>
            <div>
              <Label>Assign Staff (Optional)</Label>
              <Select value={assignedStaffId} onValueChange={setAssignedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a waiter" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => addTableMutation.mutate()}
              disabled={!tableNumber || addTableMutation.isPending}
            >
              {addTableMutation.isPending ? 'Adding...' : 'Add Table'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Table {selectedTable?.table_number} - QR Code</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="flex flex-col items-center gap-4">
              <div id={`qr-${selectedTable.id}`}>
                <QRCodeCanvas
                  value={`${window.location.origin}/b/${selectedTable && (window as any).__companyId__ || ''}/${branchId}?table=${selectedTable.table_number}`}
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>
              <Button className="w-full" onClick={() => downloadQRCode(selectedTable)}>
                <Download className="h-4 w-4 mr-2" /> Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManagement;

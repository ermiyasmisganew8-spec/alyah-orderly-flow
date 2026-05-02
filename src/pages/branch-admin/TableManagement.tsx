import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, Download, QrCode, Trash2, Pencil } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';


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
  const { branchId, companyId } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<BranchTable | null>(null);
  const [editTable, setEditTable] = useState<BranchTable | null>(null);
  const [editStaffId, setEditStaffId] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [tableNumber, setTableNumber] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const queryClient = useQueryClient();

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
    enabled: !!branchId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['branch-waiters', branchId],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('branch_id', branchId)
        .eq('role', 'staff');
      const userIds = (roles || []).map((r: any) => r.user_id);
      if (userIds.length === 0) return [] as Staff[];
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      return (profs || []).map((p: any) => ({ id: p.user_id, full_name: p.full_name || 'Unknown' })) as Staff[];
    },
    enabled: !!branchId,
  });

  const buildQRUrl = (tn: number) => `${window.location.origin}/b/${companyId}/${branchId}?table=${tn}`;

  const addTableMutation = useMutation({
    mutationFn: async () => {
      const tn = parseInt(tableNumber);
      const { error } = await supabase.from('branch_tables').insert({
        branch_id: branchId,
        table_number: tn,
        assigned_staff_id: assignedStaffId || null,
        status: 'active',
        qr_code_url: buildQRUrl(tn),
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
    onError: (err: any) => toast.error(err.message || 'Failed to add table'),
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
    onError: (err: any) => toast.error(err.message || 'Failed to delete table'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('branch_tables').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branch_tables', branchId] }),
  });

  const editTableMutation = useMutation({
    mutationFn: async () => {
      if (!editTable) return;
      const { error } = await supabase
        .from('branch_tables')
        .update({ assigned_staff_id: editStaffId || null, status: editStatus })
        .eq('id', editTable.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch_tables', branchId] });
      toast.success('Table updated');
      setShowEditModal(false);
      setEditTable(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  });

  const openEdit = (table: BranchTable) => {
    setEditTable(table);
    setEditStaffId(table.assigned_staff_id || '');
    setEditStatus(table.status);
    setShowEditModal(true);
  };

  const downloadQRCode = (table: BranchTable) => {
    const qrElement = document.getElementById(`qr-${table.id}`);
    const canvas = qrElement?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `table-${table.table_number}-qr.png`;
      link.click();
      toast.success('QR code downloaded');
    } else {
      toast.error('Open the QR code preview first');
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
          <CardTitle>Tables ({tables.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table #</TableHead>
                <TableHead>Assigned Waitress</TableHead>
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
                    <button
                      onClick={() => updateStatus.mutate({ id: table.id, status: table.status === 'active' ? 'inactive' : 'active' })}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        table.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {table.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedTable(table); setShowQRModal(true); }}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteTableMutation.mutate(table.id)}>
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

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Table Number</Label>
              <Input type="number" min="1" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g., 1" />
            </div>
            <div>
              <Label>Assign Waitress (Optional)</Label>
              <Select value={assignedStaffId} onValueChange={setAssignedStaffId}>
                <SelectTrigger><SelectValue placeholder="Select a waitress" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => addTableMutation.mutate()} disabled={!tableNumber || addTableMutation.isPending}>
              {addTableMutation.isPending ? 'Adding...' : 'Add Table'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Table {selectedTable?.table_number} – QR Code</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="flex flex-col items-center gap-4">
              <div id={`qr-${selectedTable.id}`} className="bg-white p-4 rounded">
                <QRCodeCanvas
                  value={buildQRUrl(selectedTable.table_number)}
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-xs text-muted-foreground break-all text-center">{buildQRUrl(selectedTable.table_number)}</p>
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

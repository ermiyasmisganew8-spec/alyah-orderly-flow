// Fixed IDs for Canoe Ethiopian Café
export const CANOE_COMPANY_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
export const CANOE_BRANCH_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  served: 'Served',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning text-warning-foreground',
  preparing: 'bg-primary text-primary-foreground',
  served: 'bg-success text-success-foreground',
  paid: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
};

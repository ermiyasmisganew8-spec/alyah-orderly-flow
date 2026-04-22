import { Link } from 'react-router-dom';
import { Bell, ArrowRight } from 'lucide-react';
import { useActiveOrder } from '@/hooks/useActiveOrder';

interface Props {
  companyId: string;
  branchId: string;
  tableNumber: number;
}

const ActiveOrderBanner = ({ companyId, branchId, tableNumber }: Props) => {
  const { data: orderId } = useActiveOrder(branchId);
  if (!orderId) return null;

  return (
    <div className="sticky top-16 z-40 bg-primary text-primary-foreground shadow-md animate-fade-in">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="h-4 w-4 shrink-0 animate-pulse" />
          <p className="text-sm font-medium truncate">You have an active order — track it here</p>
        </div>
        <Link
          to={`/b/${companyId}/${branchId}/order/${orderId}?table=${tableNumber}`}
          className="flex items-center gap-1 text-sm font-semibold bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors rounded-md px-3 py-1 shrink-0"
        >
          View Order Status <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ActiveOrderBanner;

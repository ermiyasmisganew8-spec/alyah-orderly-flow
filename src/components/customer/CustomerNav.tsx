import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CustomerNavProps {
  companyId: string;
  branchId: string;
  tableNumber: number;
  companyName: string;
}

const CustomerNav = ({ companyId, branchId, tableNumber, companyName }: CustomerNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const base = `/b/${companyId}/${branchId}`;
  const tableParam = `?table=${tableNumber}`;

  const links = [
    { label: 'Home', path: `${base}${tableParam}` },
    { label: 'Menu', path: `${base}/menu${tableParam}` },
    { label: 'Promotions', path: `${base}/promotions${tableParam}` },
    { label: 'About', path: `${base}/about${tableParam}` },
    { label: 'Contact', path: `${base}/contact${tableParam}` },
  ];

  const isActive = (path: string) => location.pathname + location.search === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b shadow-card">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to={`${base}${tableParam}`} className="font-display text-xl font-bold text-primary">
          {companyName}
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(l.path) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to={`${base}/cart${tableParam}`} className="relative">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {totalItems}
              </Badge>
            )}
          </Link>
          {!user && (
            <Link to={`${base}/login${tableParam}`}>
              <Button variant="outline" size="sm"><User className="h-4 w-4 mr-1" /> Login</Button>
            </Link>
          )}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t bg-card p-4 animate-fade-in">
          {links.map(l => (
            <Link
              key={l.path}
              to={l.path}
              onClick={() => setIsOpen(false)}
              className={`block py-2 text-sm font-medium ${
                isActive(l.path) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default CustomerNav;

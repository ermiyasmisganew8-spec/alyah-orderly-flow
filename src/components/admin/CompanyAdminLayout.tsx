import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyName } from '@/hooks/useCompanyName';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Users, Shield, Building2, Settings, Menu, X, LogOut
} from 'lucide-react';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/company-admin' },
  { icon: Users, label: 'Admin Management', path: '/company-admin/admins' },
  { icon: Shield, label: 'Permissions', path: '/company-admin/permissions' },
  { icon: Building2, label: 'Branch Management', path: '/company-admin/branches' },
  { icon: Settings, label: 'Settings', path: '/company-admin/settings' },
];

const CompanyAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, companyId } = useAuth();
  const location = useLocation();
  const companyName = useCompanyName(companyId);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="font-display text-lg font-bold text-sidebar-primary">Company Admin</h1>
          <p className="text-xs text-sidebar-foreground/60">{companyName} Cafe and Restaurant</p>
        </div>
        <nav className="p-2 space-y-1">
          {sidebarItems.map(item => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === item.path ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
              }`}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/60" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b h-14 flex items-center px-4 md:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="ml-3 font-display font-semibold">Company Admin</span>
        </header>
        <main className="p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
};

export default CompanyAdminLayout;

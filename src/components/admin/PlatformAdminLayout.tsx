import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Building2, Settings, Shield, BarChart3, Menu, X, LogOut
} from 'lucide-react';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/platform-admin' },
  { icon: Building2, label: 'Company Management', path: '/platform-admin/companies' },
  { icon: Settings, label: 'Global Settings', path: '/platform-admin/settings' },
  { icon: Shield, label: 'Security Logs', path: '/platform-admin/security' },
  { icon: BarChart3, label: 'Financial Reports', path: '/platform-admin/reports' },
];

const PlatformAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex dark" style={{ background: 'hsl(222, 47%, 6%)' }}>
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}
        style={{ background: 'hsl(222, 47%, 5%)', borderRight: '1px solid hsl(222, 30%, 14%)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'hsl(222, 30%, 14%)' }}>
          <h1 className="font-display text-lg font-bold" style={{ color: 'hsl(25, 80%, 50%)' }}>Alyah Platform</h1>
          <p className="text-xs" style={{ color: 'hsl(210, 30%, 55%)' }}>Platform Administration</p>
        </div>
        <nav className="p-2 space-y-1">
          {sidebarItems.map(item => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                color: location.pathname === item.path ? 'hsl(210, 30%, 92%)' : 'hsl(210, 15%, 55%)',
                background: location.pathname === item.path ? 'hsl(222, 30%, 14%)' : 'transparent',
              }}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="ghost" size="sm" className="w-full justify-start" style={{ color: 'hsl(210, 15%, 50%)' }} onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1">
        <header className="sticky top-0 z-30 h-14 flex items-center px-4 md:hidden" style={{ background: 'hsl(222, 40%, 8%)', borderBottom: '1px solid hsl(222, 30%, 14%)' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: 'hsl(210, 30%, 88%)' }}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="ml-3 font-display font-semibold" style={{ color: 'hsl(210, 30%, 88%)' }}>Platform Admin</span>
        </header>
        <main className="p-4 md:p-6" style={{ color: 'hsl(210, 30%, 92%)' }}><Outlet /></main>
      </div>
    </div>
  );
};

export default PlatformAdminLayout;

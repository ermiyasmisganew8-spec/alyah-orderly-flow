import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyName } from '@/hooks/useCompanyName';
import { supabase } from '@/integrations/supabase/client';
import { NavLink } from '@/components/NavLink';
import { ChefHat, Settings, LogOut, LayoutDashboard, Coins, User } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';

const StaffLayout = () => {
  const { signOut, companyId, user } = useAuth();
  const navigate = useNavigate();
  const companyName = useCompanyName(companyId);

  const { data: position } = useQuery({
    queryKey: ['staff-position', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('staff_position')
        .eq('user_id', user!.id)
        .maybeSingle();
      return (data as any)?.staff_position ?? 'waiter';
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isManager = position === 'manager';

  const items = isManager
    ? [
        { title: 'Dashboard', url: '/staff', icon: LayoutDashboard },
        { title: 'Tips Overview', url: '/staff/tips-overview', icon: Coins },
        { title: 'Settings', url: '/staff/settings', icon: Settings },
      ]
    : [
        { title: 'My Tips', url: '/staff/tips', icon: Coins },
        { title: 'Settings', url: '/staff/settings', icon: Settings },
      ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                <ChefHat className="h-4 w-4 mr-2" />
                Staff Panel
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <span className="font-display text-lg font-bold">{companyName} Cafe and Restaurant – Staff</span>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StaffLayout;

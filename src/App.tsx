import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "./pages/NotFound.tsx";

// Customer pages
import CustomerLayout from "@/components/customer/CustomerLayout";
import CustomerHome from "@/pages/customer/CustomerHome";
import CustomerMenu from "@/pages/customer/CustomerMenu";
import CustomerPromotions from "@/pages/customer/CustomerPromotions";
import CustomerAbout from "@/pages/customer/CustomerAbout";
import CustomerContact from "@/pages/customer/CustomerContact";
import CustomerCart from "@/pages/customer/CustomerCart";
import CustomerOrderTracking from "@/pages/customer/CustomerOrderTracking";
import CustomerLogin from "@/pages/customer/CustomerLogin";

// Staff
import AdminLogin from "@/components/auth/AdminLogin";
import StaffDashboard from "@/pages/staff/StaffDashboard";

// Branch Admin
import BranchAdminLayout from "@/components/admin/BranchAdminLayout";
import BranchDashboard from "@/pages/branch-admin/BranchDashboard";
import MenuManagement from "@/pages/branch-admin/MenuManagement";
import BranchFeedback from "@/pages/branch-admin/BranchFeedback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to Canoe customer page */}
            <Route path="/" element={<Navigate to="/b/a1b2c3d4-e5f6-4890-abcd-ef1234567890/b2c3d4e5-f6a7-4901-bcde-f12345678901?table=1" replace />} />

            {/* Customer routes */}
            <Route path="/b/:companyId/:branchId" element={<CustomerLayout />}>
              <Route index element={<CustomerHome />} />
              <Route path="menu" element={<CustomerMenu />} />
              <Route path="promotions" element={<CustomerPromotions />} />
              <Route path="about" element={<CustomerAbout />} />
              <Route path="contact" element={<CustomerContact />} />
              <Route path="cart" element={<CustomerCart />} />
              <Route path="order/:orderId" element={<CustomerOrderTracking />} />
              <Route path="login" element={<CustomerLogin />} />
            </Route>

            {/* Staff */}
            <Route path="/staff/login" element={<AdminLogin title="Staff Login" expectedRole="staff" redirectPath="/staff" />} />
            <Route path="/staff" element={<StaffDashboard />} />

            {/* Branch Admin */}
            <Route path="/branch-admin/login" element={<AdminLogin title="Branch Admin Login" expectedRole="branch_admin" redirectPath="/branch-admin" />} />
            <Route path="/branch-admin" element={<BranchAdminLayout />}>
              <Route index element={<BranchDashboard />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="feedback" element={<BranchFeedback />} />
            </Route>

            {/* Company Admin */}
            <Route path="/company-admin/login" element={<AdminLogin title="Company Admin Login" expectedRole="company_admin" redirectPath="/company-admin" />} />

            {/* Platform Admin */}
            <Route path="/platform-admin/login" element={<AdminLogin title="Platform Admin Login" expectedRole="platform_admin" redirectPath="/platform-admin" />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

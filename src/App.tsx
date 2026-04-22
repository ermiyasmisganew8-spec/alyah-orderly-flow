import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "./pages/NotFound.tsx";

// Landing
import LandingPage from "@/pages/LandingPage";

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

// Unified Login
import Login from "@/pages/Login";

// Staff
import StaffLayout from "@/components/staff/StaffLayout";
import StaffDashboardContent from "@/pages/staff/StaffDashboardContent";
import StaffSettings from "@/pages/staff/StaffSettings";
import StaffTips from "@/pages/staff/StaffTips";
import StaffTipsOverview from "@/pages/staff/StaffTipsOverview";

// Branch Admin
import BranchAdminLayout from "@/components/admin/BranchAdminLayout";
import BranchDashboard from "@/pages/branch-admin/BranchDashboard";
import MenuManagement from "@/pages/branch-admin/MenuManagement";
import CategoryManagement from "@/pages/branch-admin/CategoryManagement";
import BranchPromotions from "@/pages/branch-admin/BranchPromotions";
import BranchAnalytics from "@/pages/branch-admin/BranchAnalytics";
import BranchStaff from "@/pages/branch-admin/BranchStaff";
import BranchFeedback from "@/pages/branch-admin/BranchFeedback";
import BranchSettings from "@/pages/branch-admin/BranchSettings";

// Company Admin
import CompanyAdminLayout from "@/components/admin/CompanyAdminLayout";
import CompanyDashboard from "@/pages/company-admin/CompanyDashboard";
import AdminManagement from "@/pages/company-admin/AdminManagement";
import CompanyPermissions from "@/pages/company-admin/CompanyPermissions";
import BranchManagement from "@/pages/company-admin/BranchManagement";
import CompanyInfo from "@/pages/company-admin/CompanyInfo";
import CompanySettings from "@/pages/company-admin/CompanySettings";

// Platform Admin
import PlatformAdminLayout from "@/components/admin/PlatformAdminLayout";
import PlatformDashboard from "@/pages/platform-admin/PlatformDashboard";
import CompanyManagement from "@/pages/platform-admin/CompanyManagement";
import CompanyRequests from "@/pages/platform-admin/CompanyRequests";
import GlobalSettings from "@/pages/platform-admin/GlobalSettings";
import SecurityLogs from "@/pages/platform-admin/SecurityLogs";
import FinancialReports from "@/pages/platform-admin/FinancialReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<LandingPage />} />

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

            {/* Unified Login */}
            <Route path="/login" element={<Login />} />

            {/* Staff with sidebar layout */}
            <Route path="/staff" element={<StaffLayout />}>
              <Route index element={<StaffDashboardContent />} />
              <Route path="tips" element={<StaffTips />} />
              <Route path="tips-overview" element={<StaffTipsOverview />} />
              <Route path="settings" element={<StaffSettings />} />
            </Route>

            {/* Branch Admin */}
            <Route path="/branch-admin" element={<BranchAdminLayout />}>
              <Route index element={<BranchDashboard />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="promotions" element={<BranchPromotions />} />
              <Route path="analytics" element={<BranchAnalytics />} />
              <Route path="staff" element={<BranchStaff />} />
              <Route path="feedback" element={<BranchFeedback />} />
              <Route path="settings" element={<BranchSettings />} />
            </Route>

            {/* Company Admin */}
            <Route path="/company-admin" element={<CompanyAdminLayout />}>
              <Route index element={<CompanyDashboard />} />
              <Route path="admins" element={<AdminManagement />} />
              <Route path="permissions" element={<CompanyPermissions />} />
              <Route path="branches" element={<BranchManagement />} />
              <Route path="info" element={<CompanyInfo />} />
              <Route path="settings" element={<CompanySettings />} />
            </Route>

            {/* Platform Admin */}
            <Route path="/platform-admin" element={<PlatformAdminLayout />}>
              <Route index element={<PlatformDashboard />} />
              <Route path="companies" element={<CompanyManagement />} />
              <Route path="requests" element={<CompanyRequests />} />
              <Route path="settings" element={<GlobalSettings />} />
              <Route path="security" element={<SecurityLogs />} />
              <Route path="reports" element={<FinancialReports />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

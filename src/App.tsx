
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageTransition, ScrollProgress } from "@/lib/scroll-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GovProtectedRoute } from "@/components/auth/GovProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import Auth from "./pages/Auth";
import GovAuth from "./pages/GovAuth";
import GovPanel from "./pages/GovPanel";
import GovResolve from "./pages/GovResolve";
import Dashboard from "./pages/Dashboard";
import ReportIssue from "./pages/ReportIssue";
import Feed from "./pages/Feed";
import IssueDetail from "./pages/IssueDetail";
import MyReports from "./pages/MyReports";
import MapView from "./pages/MapView";
import ShareToAuthorities from "./pages/ShareToAuthorities";
import ReportAbuse from "./pages/ReportAbuse";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NotificationSettings from "./pages/NotificationSettings";
import SuperadminDashboard from "./pages/SuperadminDashboard";
import SuperadminReports from "./pages/SuperadminReports";
import SuperadminReportEdit from "./pages/SuperadminReportEdit";
import SuperadminViewReport from "./pages/SuperadminViewReport";
import UploadCivicModule from "./pages/UploadCivicModule";
import Home from "./pages/Home";
import UserProfile from "./pages/UserProfile";
import TopReporters from "./pages/TopReporters";
import SuperadminUsers from "./pages/SuperadminUsers";
import SuperadminEditUser from "./pages/SuperadminEditUser";
import SuperadminViewUser from "./pages/SuperadminViewUser";
import SuperadminGovUsers from "./pages/SuperadminGovUsers";
import SuperadminEditGovUser from "./pages/SuperadminEditGovUser";
import SuperadminViewGovUser from "./pages/SuperadminViewGovUser";
import SuperadminFlagReports from "./pages/SuperadminFlagReports";
import SuperadminViewFlagReport from "./pages/SuperadminViewFlagReport";
import SuperadminSettings from "./pages/SuperadminSettings";
import SuperadminAppAnalytics from "./pages/SuperadminAppAnalytics";
import SuperadminSystemHealth from "./pages/SuperadminSystemHealth";
import SuperadminNotifications from "./pages/SuperadminNotifications";
import UserNotifications from "./pages/UserNotifications";
import GovNotifications from "./pages/GovNotifications";
import SuperadminLogin from "./pages/SuperadminLogin";
import Join from "./pages/Join";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollProgress />
          <PageTransition>
            <Routes>
            <Route path="/" element={<Join />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/gov-auth" element={<GovAuth />} />
            <Route path="/gov-panel" element={
              <GovProtectedRoute>
                <GovPanel />
              </GovProtectedRoute>
            } />
            <Route path="/gov-resolve/:id" element={
              <GovProtectedRoute>
                <GovResolve />
              </GovProtectedRoute>
            } />
            <Route path="/report" element={
              <AppLayout>
                <ReportIssue />
              </AppLayout>
            } />
            <Route path="/report/new" element={
              <AppLayout>
                <ReportIssue />
              </AppLayout>
            } />
            <Route path="/feed" element={
              <AppLayout>
                <Feed />
              </AppLayout>
            } />
            <Route path="/reports" element={
              <AppLayout>
                <Feed />
              </AppLayout>
            } />
            <Route path="/home" element={
              <AppLayout>
                <Home />
              </AppLayout>
            } />
            <Route path="/report/:id" element={
              <AppLayout>
                <IssueDetail />
              </AppLayout>
            } />
            <Route path="/issue/:id" element={
              <AppLayout>
                <IssueDetail />
              </AppLayout>
            } />
            <Route path="/share/:id" element={
              <ProtectedRoute>
                <ShareToAuthorities />
              </ProtectedRoute>
            } />
            <Route path="/report-abuse/:id" element={
              <ProtectedRoute>
                <ReportAbuse />
              </ProtectedRoute>
            } />
            <Route path="/map" element={
              <AppLayout>
                <MapView />
              </AppLayout>
            } />
            <Route path="/shame" element={
              <AppLayout>
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold">Shame Board</h1>
                    <p className="text-muted-foreground mt-2">Public accountability board coming soon...</p>
                  </div>
              </AppLayout>
            } />
            <Route path="/my-reports" element={
              <ProtectedRoute>
                <AppLayout>
                  <MyReports />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <EditProfile />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <AppLayout>
                  <NotificationSettings />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/user-notifications" element={
              <ProtectedRoute>
                <AppLayout>
                  <UserNotifications />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/gov-notifications" element={
              <GovProtectedRoute>
                <AppLayout>
                  <GovNotifications />
                </AppLayout>
              </GovProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/login" element={<SuperadminLogin />} />
            <Route path="/superadmin" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminDashboard />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/reports" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminReports />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/report-edit/:id" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminReportEdit />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/view-report/:id" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminViewReport />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/upload-module" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <UploadCivicModule />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/user/:id" element={
              <AppLayout>
                <UserProfile />
              </AppLayout>
            } />
            <Route path="/top-reporters" element={
              <AppLayout>
                <TopReporters />
              </AppLayout>
            } />
            <Route path="/superadmin/user" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminUsers />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/users" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminUsers />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/edit-user/:id" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminEditUser />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/view-user/:id" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminViewUser />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/govuser" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminGovUsers />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/edit-govuser/:id" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminEditGovUser />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/view-govuser/:id" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminViewGovUser />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/flag-reports" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminFlagReports />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/view-flag-report/:id" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminViewFlagReport />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/settings" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminSettings />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/app-analytics" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminAppAnalytics />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/system-health" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminSystemHealth />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin/notifications" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminLayout>
                  <SuperadminNotifications />
                </SuperAdminLayout>
              </ProtectedRoute>
            } />
          </Routes>
          </PageTransition>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

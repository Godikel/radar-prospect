import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import SetPassword from "./pages/SetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import EmailComposer from "./pages/EmailComposer";
import Outreach from "./pages/Outreach";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/admin/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Intercept auth hash tokens BEFORE React renders — must run synchronously
if (typeof window !== 'undefined') {
  const hash = window.location.hash;
  const path = window.location.pathname;
  if (hash && path !== '/auth/callback' && (hash.includes('access_token') || hash.includes('error=') || hash.includes('type='))) {
    window.location.replace('/auth/callback' + hash);
  }
}

const App = () => {
  const checkAuthOnBoot = useAuthStore(s => s.checkAuthOnBoot);

  useEffect(() => {
    checkAuthOnBoot();
  }, [checkAuthOnBoot]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/set-password" element={<SetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/emails" element={<ProtectedRoute><EmailComposer /></ProtectedRoute>} />
            <Route path="/outreach" element={<ProtectedRoute><Outreach /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'org_admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
